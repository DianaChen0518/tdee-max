export default {
  header: {
    title: '科学 TDEE 管理',
    audit: '报表中心',
    datavis: '动态观测',
    settings: '设置',
    dark: '黑夜',
    light: '白天',
    backToToday: '回今日'
  },
  dashboard: {
    title: '当日大盘',
    save: '保存当日',
    reset: '清空重置',
    export: '导出全部历史记录为 Excel',
    intake: '摄入',
    totalIntake: '总摄入',
    tdee: '消耗',
    deficit: '缺口',
    dailyDeficit: '当日热量缺口',
    equivalentTo: '等价于 {action} {val}g 脂肪',
    actionConsuming: '消耗',
    actionStoring: '囤积',
    overLimit: '已超出 {val} kcal!',
    steps: '步数',
    weight: '体重',
    metrics: {
      bmr: 'BMR (基础代谢)',
      neat: 'NEAT (步数/日常)',
      tef: 'TEF (食物热效应)',
      eat: 'EAT (运动能耗)',
      epoc: 'EPOC (后燃效应)',
      errorMargin: '(±20%~25% 误差)'
    },
    confirmReset: '⚠️ 危险操作：\n确定要清空 {date} 这天的所有数据吗？\n此操作不可逆！'
  },
  diet: {
    title: '饮食摄入',
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
    uncategorized: '未分类',
    placeholderFood: '食物名称',
    placeholderCals: '热量',
    unitKcal: '千卡',
    unitKj: '千焦',
    eat: '吃下肚',
    saveQuick: '存快捷',
    comboTitle: '我的极速套餐库',
    saveCombo: '存为套餐',
    copyTomorrow: '复制至明日',
    empty: '当日未记录饮食',
    copyYesterday: '一键复制昨日全天',
    comboPrompt: '请输入组合名称 (将保存 {count} 种食物):',
    comboDefaultName: '{meal} 常用组合',
    mealLabels: {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
      uncategorized: '未分类'
    }
  },
  notifications: {
    saveSuccess: '已安全保存 {date} 的数据到本地',
    syncing: '正在同步到云端 Gist...',
    syncSuccess: '云端备份同步成功！',
    syncError: '云端同步失败: {msg}',
    quickFoodSaved: '已存入快捷库',
    comboSaved: '套餐【{name}】已保存',
    comboLoaded: '已加载套餐【{name}】',
    copyTomorrowSuccess: '{name} 已成功投递至明日',
    resetSuccess: '已重置当日数据',
    comboEmptyError: '本餐没有食物可以保存！'
  },
  workout: {
    title: '运动记录',
    add: '添加',
    empty: '当日无运动记录',
    types: {
      aerobic: '🏃 有氧运动 (心率计算)',
      anaerobic: '🏋️ 无氧力量 (METs计算)',
      manual: '⚡ 手动录入 (手环/App直出)'
    },
    labels: {
      hr: '平均心率',
      mins: '时长(分)',
      secs: '时长(秒)',
      intensity: '训练强度',
      kcal: '直接填入手环/App显示的消耗热量 (kcal)'
    },
    intensities: {
      low: '低 (热身/恢复)',
      med: '中 (常规增肌)',
      high: '高 (大重量复合)'
    }
  },
  settings: {
    title: '个人基础生理数据',
    firstTimeTip: '首次使用必填！此数据仅保存在本地浏览器，绝对隐私安全。',
    changeTip: '数据变动会影响全局 BMR 代谢计算公式。',
    labels: {
      birthDate: '出生日期 (用于精确计算年龄)',
      height: '身高 (cm)',
      rhr: '静息心率 (RHR)',
      gender: '生理性别 (Mifflin-St Jeor 公式基数)',
      language: '界面语言 (Language)',
      token: 'GitHub PAT (Token)',
      gistId: '备份库 ID (Gist ID) - 首次备份留空自动生成'
    },
    languages: {
      zh: '简体中文',
      en: 'English'
    },
    rhrTip: '💡 基于 Tanaka 公式精确推导储备心率 (HRR)。后燃效应 (EPOC) 采用三段线性强度模型 + 时长修正因子 (0.7x - 1.1x) 计算，确保短时运动有补偿，长时运动有增益。',
    genders: {
      M: '男性',
      F: '女性'
    },
    gist: {
      title: 'Github Gist 云端数据漫游',
      tip: '使用 Github 私有 Gist 进行数据灾备和跨端漫游，告别 LocalStorage 丢失烦恼。'
    },
    actions: {
      backup: '推送至云端',
      restore: '从云拉取覆盖',
      saveClose: '完成并关闭',
      saveStart: '保存并开始使用'
    },
    messages: {
      restoreConfirm: '这将会用云端数据覆盖你现在所有的本地记录，确认执行吗？',
      tokenRequired: '必须填写 GitHub Token 才能同步！',
      tokenGistRequired: '必须填写 Token 及要恢复的 Gist ID！',
      backupSuccess: '云端备份成功！',
      restoreSuccess: '已从云端恢复历史数据！',
      syncError: '同步异常: {message}',
      restoreError: '恢复失败: {message}'
    }
  },
  datavis: {
    title: '动态数据观测站',
    close: '关闭 面板',
    empty: '暂无数据记录',
    ranges: {
      7: '近 7 天',
      30: '近 30 天',
      all: '全部'
    },
    stats: {
      totalDeficit: '区间累计热量缺口',
      fatChange: '理论脂肪变动',
      fatLost: '消耗',
      fatGained: '反弹',
      avgIntake: '日均摄入'
    },
    charts: {
      weightTrend: '📉 纯净化体重趋势',
      energyAgainst: '🔥 热量对抗赛 (消耗 vs 摄入)',
      weightLabel: '体重走势 (kg)',
      intakeLabel: '摄入 (Intake)',
      tdeeLabel: '消耗 (TDEE)'
    },
    details: '明细参考 (近期 7 条)'
  },
  export: {
    sheetName: '数据追踪',
    columns: {
      date: '日期',
      weight: '体重(kg)',
      intake: '总摄入(kcal)',
      tdee: '总消耗_TDEE(kcal)',
      deficit: '当日缺口(kcal)'
    }
  },
  defaults: {
    foods: {
      chicken: '生鸡胸肉 (100g)',
      rice: '熟米饭 (100g)',
      egg: '水煮蛋 (1个)',
      coffee: '黑咖啡'
    }
  }
};
