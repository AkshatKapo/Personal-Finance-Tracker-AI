export async function aiCategorize(description: string) {
  const res = await fetch("http://localhost:4000/api/ai/categorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) throw new Error("AI categorization failed");

  const data = await res.json();
  return data.category;
}
