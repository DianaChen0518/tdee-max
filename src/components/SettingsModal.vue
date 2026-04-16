<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';

const store = useTdeeStore();
const emit = defineEmits(['close']);

const isValid = computed(() => {
  return store.userProfile.birthDate !== '' && store.userProfile.heightCm > 0;
});

const handleClose = () => {
  if (isValid.value) {
    emit('close');
  }
};

const syncInProgress = ref(false);
const syncError = ref('');
const syncSuccess = ref('');

const backupData = async () => {
    if (!store.githubToken) {
        syncError.value = '必须填写 GitHub Token 才能同步！';
        return;
    }
    syncInProgress.value = true;
    syncError.value = '';
    syncSuccess.value = '';
    
    const payloadContent = JSON.stringify({
        userProfile: store.userProfile,
        database: store.database,
        commonFoods: store.commonFoods,
        recipeCombos: store.recipeCombos
    });

    try {
        const url = store.gistId 
            ? `https://api.github.com/gists/${store.gistId}`
            : 'https://api.github.com/gists';
            
        const method = store.gistId ? 'PATCH' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `token ${store.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: "TDEE Tracker Cloud Backup",
                public: false,
                files: {
                    "tdee-backup.json": {
                        content: payloadContent
                    }
                }
            })
        });
        
        if (!res.ok) throw new Error('API 拒绝，可能 Token 无效');
        const data = await res.json();
        
        if (!store.gistId) {
            store.gistId = data.id;
        }
        syncSuccess.value = '云端备份成功！(' + new Date().toLocaleTimeString() + ')';
    } catch (e: any) {
        syncError.value = '云端同步失败: ' + e.message;
    } finally {
        syncInProgress.value = false;
    }
};

const restoreData = async () => {
    if (!store.githubToken || !store.gistId) {
        syncError.value = '必须填写 Token 及要恢复的 Gist ID！';
        return;
    }
    if(!confirm('这将会用云端数据覆盖你现在所有的本地记录，确认执行吗？')) return;
    
    syncInProgress.value = true;
    syncError.value = '';
    syncSuccess.value = '';

    try {
        const res = await fetch(`https://api.github.com/gists/${store.gistId}`, {
            headers: {
                'Authorization': `token ${store.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!res.ok) throw new Error('拉取失败，请检查 Gist ID 或 Token');
        const data = await res.json();
        const contentStr = data.files["tdee-backup.json"]?.content;
        if (!contentStr) throw new Error('未在 Gist 中找到 TDEE 备份文件');
        
        const parsed = JSON.parse(contentStr);
        if (parsed.userProfile) Object.assign(store.userProfile, parsed.userProfile);
        if (parsed.database) store.database = parsed.database;
        if (parsed.commonFoods) store.commonFoods = parsed.commonFoods;
        if (parsed.recipeCombos) store.recipeCombos = parsed.recipeCombos;
        
        syncSuccess.value = '已从云端恢复历史数据！';
    } catch (e: any) {
        syncError.value = '云端恢复失败: ' + e.message;
    } finally {
        syncInProgress.value = false;
    }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm" @click.self="handleClose">
    <!-- 适配了白天和黑夜的背景色 -->
    <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] w-96 shadow-2xl transition-colors">
      <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">⚙️ 个人基础生理数据</h2>
      
      <p v-if="!store.isConfigured" class="text-xs text-orange-600 dark:text-orange-400 mb-4 bg-orange-100 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800/50">
        首次使用必填！此数据仅保存在本地浏览器，绝对隐私安全。
      </p>
      <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-4">数据变动会影响全局 BMR 代谢计算公式。</p>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">出生日期 (用于精确计算年龄)</label>
          <input type="date" v-model="store.userProfile.birthDate" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">身高 (cm)</label>
          <input type="number" v-model.number="store.userProfile.heightCm" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">静息心率 (RHR)</label>
          <input type="number" v-model.number="store.userProfile.rhr" placeholder="默认 70" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
          <p class="text-[10px] text-gray-400 mt-1 leading-relaxed">
            💡 基于 Tanaka 公式精确推导储备心率 (HRR)。后燃效应 (EPOC) 采用三段线性强度模型 + 时长修正因子 (0.7x - 1.1x) 计算，确保短时运动有补偿，长时运动有增益。
          </p>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">生理性别 (Mifflin-St Jeor 公式基数)</label>
          <select v-model="store.userProfile.gender" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
            <option value="M">男性</option>
            <option value="F">女性</option>
          </select>
        </div>
      </div>

      <div class="mt-6 border-t border-gray-200 dark:border-[#333] pt-4">
        <h3 class="text-sm font-bold mb-3 text-gray-800 dark:text-white flex items-center gap-1">☁️ Github Gist 云端数据漫游</h3>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">使用 Github 私有 Gist 进行数据灾备和跨端漫游，告别 LocalStorage 丢失烦恼。</p>
        
        <div class="space-y-3 mb-3">
          <div>
            <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">GitHub PAT (Token)</label>
            <input type="password" v-model="store.githubToken" placeholder="ghp_xxx..." class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded p-2 text-xs text-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors">
          </div>
          <div>
            <label class="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">备份库 ID (Gist ID) - 首次备份留空自动生成</label>
            <input type="text" v-model="store.gistId" placeholder="一串字母数字..." class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded p-2 text-xs text-gray-800 dark:text-white outline-none focus:border-blue-500 transition-colors">
          </div>
        </div>
        
        <div class="flex gap-2 mb-2">
          <button @click="backupData" :disabled="syncInProgress" class="flex-1 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded p-2 text-xs font-bold transition-colors disabled:opacity-50">📤 推送至云端</button>
          <button @click="restoreData" :disabled="syncInProgress" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded p-2 text-xs font-bold transition-colors disabled:opacity-50">📥 从云拉取覆盖</button>
        </div>
        
        <div v-if="syncSuccess" class="text-[11px] text-green-600 dark:text-green-400 mt-2">{{ syncSuccess }}</div>
        <div v-if="syncError" class="text-[11px] text-red-500 dark:text-red-400 mt-2">{{ syncError }}</div>
      </div>
      
      <button 
        @click="handleClose" 
        :disabled="!isValid" 
        :class="['w-full py-2.5 mt-6 rounded-[12px] font-bold transition-colors', isValid ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed']"
      >
        {{ store.isConfigured ? '完成并关闭' : '保存并开始使用' }}
      </button>
    </div>
  </div>
</template>
