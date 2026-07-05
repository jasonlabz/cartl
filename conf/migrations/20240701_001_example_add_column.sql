-- @version 20240701_001
-- 增量迁移示例：文件名前缀 20240701_001 也可自动解析为版本号
-- 推荐保留 -- @version 头部声明，更明确

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
