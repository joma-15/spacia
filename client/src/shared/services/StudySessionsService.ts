import { BASE_URL } from "../config/api";

async function startStudySession(){
    console.log("study session has been start");
    const startTime = new Date();
    const response = await fetch(`${BASE_URL}/`,{
        method: "POST", 
        headers: {
             "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            startTime : startTime.toISOString(),
        }),
    }); 
    const data = await response.json();
    return data;
}

async function endStudySession() {
  console.log("study session has been end");
  const endTime = new Date();

  const response = await fetch(`${BASE_URL}/study-session/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endTime: endTime.toISOString(),
    }),
  });

  const data = await response.json();

  return data;
}