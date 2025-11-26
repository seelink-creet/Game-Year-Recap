import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 🟢 请在此处填入你的 Supabase 配置信息
// ------------------------------------------------------------------

// 1. Project URL (项目网址)
// 获取位置: 左下角 Settings (齿轮图标) -> API -> Project URL
// 格式示例: 'https://abcdefghijklm.supabase.co'
const SUPABASE_URL = 'https://jvomydzgxofnuueiwnsw.supabase.co'; 

// 2. Anon Key (API 密钥)
// 获取位置: 左下角 Settings (齿轮图标) -> API -> Project API Keys -> anon public
// 格式示例: 以 'ey' 开头的一长串字符
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b215ZHpneG9mbnV1ZWl3bnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzcyOTcsImV4cCI6MjA3OTcxMzI5N30.iFDZro9PL0fXpM3vX7v7YH4Bk6KCcK_WBCIgj8Jqocg';

// ------------------------------------------------------------------

// 检查是否已填写 (防止报错)
const isValidConfig = 
  SUPABASE_URL.length > 0 && 
  SUPABASE_ANON_KEY.length > 0 && 
  !SUPABASE_URL.includes('abcdefgh') &&
  !SUPABASE_ANON_KEY.includes('ey...');

if (!isValidConfig) {
  console.warn("⚠️ Supabase 尚未配置！请打开 lib/supabase.ts 填入 URL 和 Key。");
}

export const supabase = createClient(
  isValidConfig ? SUPABASE_URL : 'https://placeholder.supabase.co', 
  isValidConfig ? SUPABASE_ANON_KEY : 'placeholder'
);

// 导出检查函数供 App 使用
export const isSupabaseConfigured = () => isValidConfig;
