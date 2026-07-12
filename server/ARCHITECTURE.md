# Backend architecture

```
server/
  app.py              Application factory and error handlers
  config.py           Environment-based configuration
  extensions.py       Flask extension instances
  errors.py           API exceptions
  validation.py       Shared request validation
  models/             SQLAlchemy entities and serialization
  routes/             Class-based HTTP controllers
  services/           Business logic and persistence orchestration
  tests/              Automated tests
```

## Boundaries

- Routes validate requests and format responses; they do not contain business logic.
- Services own use cases and database changes.
- Models represent persisted data and provide `to_dict()` serialization.
- `app.py` owns dependency wiring and centralized error handling.

Add a feature by creating its model (when needed), service, and controller. Reuse the validation and error helpers rather than duplicating response handling.
