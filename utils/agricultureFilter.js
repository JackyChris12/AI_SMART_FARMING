// utils/agricultureFilter.js (create this file if it doesn't exist)
function isAgricultureQuestion(question) {
  if (!question || typeof question !== "string") return false;

  const agricultureKeywords = [
    "crop", "pest", "fertilizer", "soil", "livestock", "plant", "disease",
    "weather", "farming", "agriculture", "harvest", "yield", "pesticide", "drought"
  ];

  const lowerCaseQuestion = question.toLowerCase();
  return agricultureKeywords.some(keyword => lowerCaseQuestion.includes(keyword));
}

module.exports = { isAgricultureQuestion };
