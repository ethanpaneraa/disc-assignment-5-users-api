"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const BUCKET_NAME = "disc-user-profile-pictures";
const IMAGES_DIR = path_1.default.join(__dirname, "../images");
const supabaseUrl = process.env.SUPABASE_URL;
const supbaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supbaseServiceKey);
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
function setupStorage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: buckets, error: listError } = yield supabaseAdmin.storage.listBuckets();
            if (listError) {
                throw new Error(`Error listing buckets: ${listError.message}`);
            }
            const bucketExists = buckets === null || buckets === void 0 ? void 0 : buckets.some((bucket) => bucket.name === BUCKET_NAME);
            if (!bucketExists) {
                console.log(`Did not find bucket with name ${BUCKET_NAME}. Creating it now...`);
                const { error: createError } = yield supabaseAdmin.storage.createBucket(BUCKET_NAME, {
                    public: true,
                    fileSizeLimit: 1024 * 1024 * 2,
                });
                if (createError) {
                    throw new Error(`Error creating bucket: ${createError.message}`);
                }
                console.log(`Bucket with name ${BUCKET_NAME} created successfully!`);
            }
            else {
                console.log(`Found bucket with name ${BUCKET_NAME}. No need to create it.`);
            }
            console.log("Setting up storage policies....");
            yield supabaseAdmin.rpc("enable_rls", {
                table_name: "objects",
                schema_name: "storage",
            });
            const policies = [
                {
                    name: "Allow public uploads",
                    sql: `
                  CREATE POLICY "allow_public_uploads"
                  ON storage.objects FOR INSERT
                  WITH CHECK (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'anon')
                `,
                },
                {
                    name: "Allow public reads",
                    sql: `
                  CREATE POLICY "allow_public_reads"
                  ON storage.objects FOR SELECT
                  USING (bucket_id = '${BUCKET_NAME}')
                `,
                },
                {
                    name: "Allow public updates",
                    sql: `
                  CREATE POLICY "allow_public_updates"
                  ON storage.objects FOR UPDATE
                  USING (bucket_id = '${BUCKET_NAME}')
                  WITH CHECK (bucket_id = '${BUCKET_NAME}')
                `,
                },
                {
                    name: "Allow public deletes",
                    sql: `
                  CREATE POLICY "allow_public_deletes"
                  ON storage.objects FOR DELETE
                  USING (bucket_id = '${BUCKET_NAME}')
                `,
                },
            ];
            for (const policy of policies) {
                try {
                    console.log(`Creating policy: ${policy.name}`);
                    yield supabaseAdmin.rpc("create_policy", {
                        bucket_id: BUCKET_NAME,
                        policy_name: policy.name.toLowerCase().replace(/ /g, "_"),
                        definition: policy.sql,
                    });
                }
                catch (error) {
                    if (!error.message.includes("already exists")) {
                        console.log(`Error creating policy: ${policy.name}`);
                    }
                    else {
                        console.log(`Policy already exists: ${policy.name}`);
                    }
                }
            }
            const files = fs_1.default.readdirSync(IMAGES_DIR);
            console.log(`Found ${files.length} files in ${IMAGES_DIR}`);
            for (const file of files) {
                if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    const filePath = path_1.default.join(IMAGES_DIR, file);
                    const fileBuffer = fs_1.default.readFileSync(filePath);
                    console.log(`Uploading: ${file}`);
                    const { error: uploadError } = yield supabaseAdmin.storage
                        .from(BUCKET_NAME)
                        .upload(`profile-images/${file}`, fileBuffer, {
                        contentType: `image/${path_1.default.extname(file).substring(1)}`,
                        upsert: true,
                    });
                    if (uploadError) {
                        console.error(`Error uploading ${file}:`, uploadError);
                    }
                    else {
                        console.log(`Successfully uploaded: ${file}`);
                    }
                }
            }
            const utilsDir = path_1.default.join(__dirname, "../utils");
            if (!fs_1.default.existsSync(utilsDir)) {
                fs_1.default.mkdirSync(utilsDir);
            }
            console.log("Upadting public URL helper function..");
            const helperCode = `
import { supabase } from '../config/supabaseClient';

export const getPublicImageUrl = (imageName: string): string => {
  const { data } = supabase.storage
    .from("${BUCKET_NAME}")
    .getPublicUrl(\`product-images/\${imageName}\`);
  return data.publicUrl;
};`;
            fs_1.default.writeFileSync(path_1.default.join(utilsDir, "storageHelper.ts"), helperCode, "utf-8");
            console.log("Storage setup completed successfully!");
        }
        catch (error) {
            console.error("Setup storage error:", error);
            process.exit(1);
        }
    });
}
setupStorage();
