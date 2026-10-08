"""
scripts/process_asset.py — 星靈織語 Starwoven 素材後製與 WebP 轉換標準腳本

用途：
  將 ComfyUI 或其他工具產出的生圖素材自動進行去背（去除純白底轉為透明 RGBA）並壓縮轉檔為 WebP，
  自動同步輸出至 demo_docs/sd-assets/ 與 public/assets/，並印出 image_prompts.md 登記表格行。

環境需求：
  pip install rembg onnxruntime pillow

使用範例：
  python scripts/process_asset.py --input demo_docs/sd-assets/z-image-turbo_00014_.png --output services_a_tarot_v1.webp --code 服務-A --name "塔羅占卜 (v1)"
"""

import os
import sys
import io
import json
import argparse
from datetime import date
from PIL import Image

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def extract_comfyui_metadata(img_path):
    seed = None
    prompt_text = ""
    try:
        im = Image.open(img_path)
        if "prompt" in im.info:
            data = json.loads(im.info["prompt"])
            for v in data.values():
                inputs = v.get("inputs", {})
                if "seed" in inputs:
                    seed = inputs["seed"]
                if "text" in inputs and isinstance(inputs["text"], str) and len(inputs["text"]) > 10:
                    prompt_text = inputs["text"].strip().replace("\n", " ")
    except Exception:
        pass
    return seed, prompt_text

def process_asset(input_path, output_name, code="", name="", skip_rembg=False, quality=85):
    # 驗證 output_name 必須為單純檔名，防止路徑遍歷或絕對路徑寫入外部目錄
    if "/" in output_name or "\\" in output_name or os.path.dirname(output_name) or output_name.strip() in ("", ".", ".."):
        print(f"錯誤：--output 僅接受純檔名（例如 services_a_tarot_v1.webp），不可包含目錄或路徑：{output_name}")
        sys.exit(1)

    # 確保副檔名為 .webp
    if not output_name.lower().endswith(".webp"):
        output_name += ".webp"

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sd_assets_dir = os.path.join(repo_root, "demo_docs", "sd-assets")
    public_assets_dir = os.path.join(repo_root, "public", "assets")
    
    if not os.path.isabs(input_path):
        input_path = os.path.abspath(os.path.join(repo_root, input_path))
    
    if not os.path.exists(input_path):
        print(f"錯誤：找不到輸入檔案 {input_path}")
        sys.exit(1)
        
    print(f"[*] 載入原始圖檔: {input_path}")
    im = Image.open(input_path)
    
    seed, prompt_text = extract_comfyui_metadata(input_path)
    
    # 判斷是否需要去背
    if skip_rembg or (im.mode == "RGBA" and im.getextrema()[3][0] < 255):
        print("[*] 圖片已包含透明通道，跳過去背處理。")
        processed_im = im.convert("RGBA")
        post_process_desc = "轉 WebP"
    else:
        print("[*] 執行高精度去背處理 (rembg)...")
        try:
            from rembg import remove
            processed_im = remove(im)
            post_process_desc = "去背 + 轉 WebP"
        except ImportError:
            print("警告：未安裝 rembg 或 onnxruntime，請先執行: pip install rembg onnxruntime")
            processed_im = im.convert("RGBA")
            post_process_desc = "轉 WebP (未去背)"
            
    sd_dst = os.path.join(sd_assets_dir, output_name)
    pub_dst = os.path.join(public_assets_dir, output_name)
    
    os.makedirs(sd_assets_dir, exist_ok=True)
    os.makedirs(public_assets_dir, exist_ok=True)
    
    print(f"[*] 壓縮並儲存 WebP (Quality={quality}, method=6)...")
    processed_im.save(sd_dst, "WEBP", quality=quality, method=6)
    processed_im.save(pub_dst, "WEBP", quality=quality, method=6)
    
    sz_kb = os.path.getsize(pub_dst) / 1024
    print(f"[+] 存檔完成：")
    print(f"    - 封存存檔: {sd_dst}")
    print(f"    - 上架存檔: {pub_dst}")
    print(f"    - 檔案大小: {sz_kb:.1f} KB")
    
    # 產生 image_prompts.md 表格記錄
    today_str = date.today().isoformat()
    code_str = f"`{code}`" if code else "`待補`"
    name_str = name if name else output_name
    seed_str = str(seed) if seed else "-"
    prompt_summary = (prompt_text[:30] + "...") if prompt_text else "手繪全彩插畫"
    
    log_row = f"| {code_str} | {name_str} | {today_str} | ComfyUI | {prompt_summary} | {seed_str} | 採用上架 | {post_process_desc} | `{output_name}` |"
    print("\n[+] 請將以下行複製貼上至 demo_docs/image_prompts.md 的「六、生成紀錄」表格：")
    print(log_row)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="星靈織語素材後製與 WebP 轉換工具")
    parser.add_argument("--input", "-i", required=True, help="原始圖檔路徑 (例如 demo_docs/sd-assets/z-image-turbo_00014_.png)")
    parser.add_argument("--output", "-o", required=True, help="輸出 WebP 檔名 (例如 services_a_tarot_v1.webp)")
    parser.add_argument("--code", "-c", default="", help="素材編號 (例如 服務-A、首頁-A)")
    parser.add_argument("--name", "-n", default="", help="素材名稱 (例如 塔羅占卜 (v1))")
    parser.add_argument("--skip-rembg", action="store_true", help="跳過 rembg 去背步驟 (若已人工去背)")
    parser.add_argument("--quality", "-q", type=int, default=85, help="WebP 壓縮品質 (預設 85)")
    
    args = parser.parse_args()
    process_asset(args.input, args.output, args.code, args.name, args.skip_rembg, args.quality)
