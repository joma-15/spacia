import { useCallback, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { Bullet, Explosion, SpaceObject } from "../types";
import { BULLET_SPEED } from "../constants";
import { makeIdGenerator } from "../utils/idGenerator";

const nextBulletId = makeIdGenerator();
const nextExplosionId = makeIdGenerator();

interface Params {
  shipX: number;
  shipY: number;
  shipSize: number;
  fireCooldownMs: number;
  maxBullets: number;
  blockInput: boolean;
  // Looks up a floating answer's current on-screen position (it's
  // always drifting, so we need the live position, not its spawn spot).
  getObjectPos: (id: number) => { x: number; y: number } | undefined;
  // Called ~220ms after a bullet lands on a bubble, once the explosion
  // has been spawned. `hitObject` is only passed when the shot actually
  // hit something (a tap on empty space fires a bullet with no target).
  onSettled: (hitObject: SpaceObject | undefined) => void;
}

/**
 * Handles the "shooting" half of the game: launching a bullet toward a
 * tapped spot, and — once it arrives — showing an explosion there. Also
 * enforces the fire-rate cooldown and the max-bullets-on-screen limit.
 *
 * This hook doesn't know anything about scoring or which answer was
 * correct; it just reports "a bullet settled here, here's what (if
 * anything) it hit" via `onSettled`.
 */
export function useBullets({ shipX, shipY, shipSize, fireCooldownMs, maxBullets, blockInput, getObjectPos, onSettled }: Params) {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);

  const lastFireTimeRef = useRef<number>(0);
  const activeBulletCountRef = useRef<number>(0);

  const handleExplosionDone = useCallback((id: number) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const fireBullet = useCallback(
    (targetX: number, targetY: number, hitObject?: SpaceObject) => {
      if (blockInput) return;

      const now = Date.now();
      if (now - lastFireTimeRef.current < fireCooldownMs) return;
      if (activeBulletCountRef.current >= maxBullets) return;

      lastFireTimeRef.current = now;
      activeBulletCountRef.current += 1;

      const startX = shipX + shipSize / 2 - 3;
      const startY = shipY;

      const anim = new Animated.ValueXY({ x: startX, y: startY });
      const id = nextBulletId();
      const bullet: Bullet = { id, anim };
      setBullets((prev) => [...prev, bullet]);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Math.max(150, (distance / BULLET_SPEED) * 1000);

      Animated.timing(anim, {
        toValue: { x: targetX, y: targetY },
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        activeBulletCountRef.current = Math.max(0, activeBulletCountRef.current - 1);
        setBullets((prev) => prev.filter((b) => b.id !== id));

        if (hitObject) {
          const result = hitObject.isCorrect ? "correct" : "wrong";
          const impactPos = getObjectPos(hitObject.id) ?? { x: hitObject.x, y: hitObject.y };
          const explosionSize = Math.max(hitObject.width, hitObject.height) * 1.5;

          setExplosions((prev) => [
            ...prev,
            {
              id: nextExplosionId(),
              x: impactPos.x + hitObject.width / 2 - explosionSize / 2,
              y: impactPos.y + hitObject.height / 2 - explosionSize / 2,
              size: explosionSize,
              variant: result,
            },
          ]);
        }

        onSettled(hitObject);
      });
    },
    [blockInput, fireCooldownMs, maxBullets, shipX, shipY, shipSize, getObjectPos, onSettled],
  );

  return { bullets, explosions, fireBullet, handleExplosionDone };
}
