fetch("http://localhost:3100/generate-pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    caseId: "TEST",
    results: "test",
    confidence: "99%",
    isReal: true
  })
}).then(res => res.text()).then(console.log).catch(console.error);
