function updateCharCount() {
  const textarea = document.getElementById("message");
  const counter = document.getElementById("charCount");
  const current = textarea.value.length;
  const max = textarea.maxLength;

  counter.textContent = `${current} / ${max}`;
  counter.classList.remove("warn", "limit");

  if (current >= max) {
    counter.classList.add("limit");
  } else if (current >= max - 50) {
    // you can adjust "100" as your warning threshold
    counter.classList.add("warn");
  }
}

document.addEventListener("DOMContentLoaded", updateCharCount);
