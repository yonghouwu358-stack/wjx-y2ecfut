window.WJX_EXAM_CONFIG = {
  // 填入 Google Apps Script 发布后的 Web App 地址后，手机答题记录会进入在线后台。
  backendUrl: "",

  // 第 1 道选择题对应 q3，第 52 道选择题对应 q54。
  questionStart: 3,
  questionEnd: 54,

  // 没有在线后台时，可以临时在这里填答案做本地判分。
  // 示例：q3: "4" 表示第 1 题正确答案是第 4 个选项。
  localAnswerKey: {
  }
};
