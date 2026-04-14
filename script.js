const form = document.querySelector("#surveyForm");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const errorSummary = document.querySelector("#errorSummary");
const successPanel = document.querySelector("#successPanel");
const likedHint = document.querySelector("#likedHint");
const endpoint = "https://script.google.com/macros/s/AKfycbwMY6RCKWEY22OymFGcWK2aT2qhYMk9P7QLVeAmPbJ86iM85BunuW8K0ZGm1WBjZXU/exec";

const trackedFields = [
  { type: "select", selector: "[name='age']" },
  { type: "select", selector: "[name='frequency']" },
  { type: "radio", name: "satisfaction" },
  { type: "checkbox-group", name: "liked" },
  { type: "textarea", selector: "[name='improvement']" },
  { type: "checkbox", selector: "[name='consent']" }
];

function hasCheckboxSelection(name) {
  return [...form.querySelectorAll(`[name='${name}']`)].some((input) => input.checked);
}

function fieldCompleted(field) {
  if (field.type === "radio") {
    return Boolean(form.querySelector(`[name='${field.name}']:checked`));
  }

  if (field.type === "checkbox-group") {
    return hasCheckboxSelection(field.name);
  }

  if (field.type === "checkbox") {
    return form.querySelector(field.selector).checked;
  }

  return form.querySelector(field.selector).value.trim() !== "";
}

function updateProgress() {
  const completed = trackedFields.filter(fieldCompleted).length;
  const percent = Math.round((completed / trackedFields.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
}

function clearErrors() {
  errorSummary.hidden = true;
  errorSummary.textContent = "";
  form.querySelectorAll(".is-invalid").forEach((element) => {
    element.classList.remove("is-invalid");
  });
  likedHint.classList.remove("is-invalid");
}

function markInvalid(selector) {
  const element = form.querySelector(selector);
  if (element) {
    element.classList.add("is-invalid");
  }
}

function validateForm() {
  clearErrors();

  const issues = [];

  if (!form.age.value) {
    issues.push("年代を選択してください。");
    markInvalid("[name='age']");
  }

  if (!form.frequency.value) {
    issues.push("利用頻度を選択してください。");
    markInvalid("[name='frequency']");
  }

  if (!form.querySelector("[name='satisfaction']:checked")) {
    issues.push("総合満足度を選択してください。");
    form.querySelector(".rating-row")?.closest(".field-group")?.classList.add("is-invalid");
  }

  if (!hasCheckboxSelection("liked")) {
    issues.push("特によかった点を1つ以上選択してください。");
    likedHint.classList.add("is-invalid");
  }

  if (!form.improvement.value.trim()) {
    issues.push("改善してほしい点を入力してください。");
    markInvalid("[name='improvement']");
  }

  if (!form.consent.checked) {
    issues.push("同意チェックを入れてください。");
    form.querySelector(".consent-row")?.classList.add("is-invalid");
  }

  if (issues.length > 0) {
    errorSummary.hidden = false;
    errorSummary.textContent = issues[0];
    return false;
  }

  return true;
}

form.addEventListener("input", updateProgress);
form.addEventListener("change", updateProgress);

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    clearErrors();
    successPanel.hidden = true;
    updateProgress();
  }, 0);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    name: formData.get("name") || "",
    email: formData.get("email") || "",
    age: formData.get("age"),
    frequency: formData.get("frequency"),
    satisfaction: formData.get("satisfaction"),
    liked: formData.getAll("liked"),
    improvement: formData.get("improvement"),
    comment: formData.get("comment") || "",
    consent: formData.get("consent") === "on"
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "送信に失敗しました。");
    }

    successPanel.hidden = false;
    errorSummary.hidden = true;
    form.reset();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  } catch (error) {
    successPanel.hidden = true;
    errorSummary.hidden = false;
    errorSummary.textContent = "送信に失敗しました。しばらくしてから再度お試しください。";
    console.error("Survey submission failed:", error);
  }
});

updateProgress();
