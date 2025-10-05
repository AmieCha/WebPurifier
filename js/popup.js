document.addEventListener("DOMContentLoaded", () => {
  const mainToggle = document.getElementById("main-toggle");
  const container = document.getElementById("container");
  const mainView = document.getElementById("main-view");
  const settingsView = document.getElementById("settings-view");
  const goToSettingsButton = document.getElementById("go-to-settings-button");
  const strengthSlider = document.getElementById("strength-slider");
  const topicsContainer = document.querySelector(".topics");
  const customTopicInput = document.getElementById("custom-topic-input");
  const addTopicButton = document.getElementById("add-topic-button");
  const backButton = document.querySelector("#settings-view .back-button");
  const methodRadios = document.querySelectorAll('input[name="response-method"]');
  const defaultTopics = ["비속어","외모","학벌","신체","정치"];

  // UI 상태 업데이트
  function updateUiEnabledState(isEnabled) {
    container.classList.toggle("disabled", !isEnabled);
  }

  // 화면 전환
  goToSettingsButton?.addEventListener("click", () => {
    mainView.style.display = "none";
    settingsView.style.display = "block";
  });
  backButton?.addEventListener("click", () => {
    settingsView.style.display = "none";
    mainView.style.display = "block";
  });

  // 커스텀 토픽 버튼 생성
  function createTopicButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add("custom");

    // 삭제 버튼
    const deleteSpan = document.createElement("span");
    deleteSpan.textContent = "✕";
    deleteSpan.classList.add("delete-btn");
    deleteSpan.addEventListener("click", e => {
      e.stopPropagation(); // 부모 버튼 클릭 방지
      button.remove();
      saveSettings();
    });
    button.appendChild(deleteSpan);

    // 클릭 시 활성화 토글
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      saveSettings();
    });

    topicsContainer.appendChild(button);
    return button;
  }

  // 커스텀 토픽 추가
  function addCustomTopic() {
    const value = customTopicInput.value.trim();
    if(!value) return;

    const existing = Array.from(topicsContainer.querySelectorAll("button"))
                          .map(b => b.textContent.replace("✕","").trim());
    if(existing.includes(value)) { alert("이미 존재하는 주제입니다."); return; }

    const btn = createTopicButton(value);
    btn.classList.add("active");
    customTopicInput.value = "";
    saveSettings();
  }

  addTopicButton.addEventListener("click", addCustomTopic);
  customTopicInput.addEventListener("keypress", e => { if(e.key === "Enter") addCustomTopic(); });

  // 기본 버튼 클릭 이벤트 연결
  function attachDefaultButtonEvents() {
    document.querySelectorAll(".topics button").forEach(btn => {
      if(!btn.classList.contains("custom")) {
        btn.addEventListener("click", () => {
          btn.classList.toggle("active");
          saveSettings();
        });
      }
    });
  }

  // 설정 불러오기
  function loadSettings() {
    const defaultSettings = { isEnabled:true, strength:"2", method:"block", selectedTopics:[] };
    chrome.storage.local.get({ customTopics:[], settings:defaultSettings }, data => {
      const { settings, customTopics } = data;

      mainToggle.checked = settings.isEnabled;
      updateUiEnabledState(settings.isEnabled);

      // 기본 버튼 상태 적용
      document.querySelectorAll(".topics button").forEach(btn => {
        btn.classList.toggle("active", settings.selectedTopics.includes(btn.textContent));
      });

      // 기본 버튼 클릭 이벤트 연결
      attachDefaultButtonEvents();

      // 커스텀 버튼 불러오기
      customTopics.forEach(text => {
        const btn = createTopicButton(text);
        if(settings.selectedTopics.includes(text)) btn.classList.add("active");
      });

      // 슬라이더 & 라디오 초기값 적용
      strengthSlider.value = settings.strength;
      const selectedRadio = document.querySelector(`input[name="response-method"][value="${settings.method}"]`);
      if(selectedRadio) selectedRadio.checked = true;
    });
  }

  // 설정 저장
  function saveSettings() {
    const selectedRadio = document.querySelector('input[name="response-method"]:checked');
    const selectedMethod = selectedRadio ? selectedRadio.value : "block";

    const selectedTopics = [];
    const customTopics = [];

    document.querySelectorAll(".topics button").forEach(button => {
      const text = button.textContent.replace("✕","").trim();
      if(button.classList.contains("active")) selectedTopics.push(text);
      if(button.classList.contains("custom")) customTopics.push(text);
    });

    const currentSettings = {
      isEnabled: mainToggle.checked,
      strength: strengthSlider.value,
      method: selectedMethod,
      selectedTopics: selectedTopics
    };

    chrome.storage.local.set({
      settings: currentSettings,
      customTopics: customTopics
    });
  }

  // 초기화
  loadSettings();
  mainToggle.addEventListener("change", () => {
    updateUiEnabledState(mainToggle.checked);
    saveSettings();
  });
  strengthSlider.addEventListener("change", saveSettings);
  methodRadios.forEach(radio => radio.addEventListener("change", saveSettings));
});
