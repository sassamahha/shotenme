// prisma.config.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local を優先的に読み込む
config({ path: resolve(process.cwd(), '.env.local') });
// .env も読み込む（フォールバック）
config({ path: resolve(process.cwd(), '.env') });

// 何も指定しなければ、デフォルトで
// prisma/schema.prisma を読むのでこれでOK
export default {};