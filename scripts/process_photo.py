"""
scripts/process_photo.py — 星靈織語 Starwoven 實拍素材最佳化與 WebP 轉換工具

用途：
  將 demo_docs/raw-photos/ 子目錄（team / courses / workshops / events）內的實拍照片，
  最佳化尺寸、套用自訂取景視窗（ROI Crop）或等比縮放，並轉換為高效能 WebP，
  輸出至生產目錄 public/assets/。

支援功能：
  1. 單張轉檔：
     python scripts/process_photo.py -i demo_docs/raw-photos/team/以恩.png -o about_b_founder_yien_v1.webp
  2. 團隊夥伴批次一鍵轉檔（含悠悠、凜月等特定取景框）：
     python scripts/process_photo.py --batch-team
  3. 固定循環課程批次轉檔：
     python scripts/process_photo.py --batch-courses
"""

import os
import sys
import argparse
from PIL import Image, ImageOps

# 團隊夥伴與版位對應設定
# 包含自訂 ROI 取景框 (left, top, right, bottom) 或置中正方形裁切
TEAM_MAPPING = {
    "以恩.png": {
        "output": "about_b_founder_yien_v1.webp",
        "code": "關於-B",
        "name": "創辦人 以恩",
        "crop_box": None, # 自動正中方形
        "size": 600,
    },
    "皮皮.png": {
        "output": "about_c_founder_pipi_v1.webp",
        "code": "關於-C",
        "name": "創辦人 皮皮",
        "crop_box": (0, 0, 462, 462), # 頭部稍微靠上，保留髮頂
        "size": 600,
    },
    "達心.png": {
        "output": "about_d_member_daxin_v1.webp",
        "code": "關於-D",
        "name": "夥伴 達心",
        "crop_box": (0, 0, 461, 461), # 保留上方頭髮
        "size": 600,
    },
    "學長.png": {
        "output": "about_e_member_xiaoyu_v1.webp",
        "code": "關於-E",
        "name": "夥伴 學長",
        "crop_box": (150, 0, 820, 671), # 橫向照片取中央頭像正方形
        "size": 600,
    },
    "悠悠.png": {
        "output": "about_f_member_youyou_v1.webp",
        "code": "關於-F",
        "name": "夥伴 悠悠",
        "crop_box": (245, 80, 525, 360), # 右上半部半身與持牌特寫
        "size": 600,
    },
    "姆姆.png": {
        "output": "about_g_member_mumu_v1.webp",
        "code": "關於-G",
        "name": "夥伴 姆姆",
        "crop_box": None,
        "size": 600,
    },
    "凜月.png": {
        "output": "about_h_member_linyue_v1.webp",
        "code": "關於-H",
        "name": "夥伴 凜月",
        "crop_box": (135, 0, 445, 310), # 右上半部桌前解盤特寫
        "size": 600,
    },
    "白白.png": {
        "output": "about_i_member_baibai_v1.webp",
        "code": "關於-I",
        "name": "夥伴 白白",
        "crop_box": None,
        "size": 600,
    },
    "Migo.png": {
        "output": "about_j_member_migo_v1.webp",
        "code": "關於-J",
        "name": "夥伴 Migo",
        "crop_box": None,
        "size": 600,
    },
    "古古.png": {
        "output": "about_k_member_gugu_v1.webp",
        "code": "關於-K",
        "name": "夥伴 古古",
        "crop_box": None,
        "size": 600,
    },
    "黎夢.jpg": {
        "output": "about_l_member_limeng_v1.webp",
        "code": "關於-L",
        "name": "夥伴 黎夢",
        "crop_box": (0, 0, 1045, 1045), # 直式取上方正方形
        "size": 600,
    },
}

# 固定循環課程現場照片對應設定 (16:10 寬螢幕比例 960x600)
COURSES_MAPPING = {
    "光與阿卡西紀錄.png": {
        "output": "courses_a_akashic_v1.webp",
        "code": "課程-A",
        "name": "週一 光與阿卡西紀錄現場照",
        "crop_box": (0, 480, 1093, 1163),  # 16:10 聚焦學員與講者
        "target_size": (960, 600),
    },
    "占星循環課.jpg": {
        "output": "courses_b_astrology_v1.webp",
        "code": "課程-B",
        "name": "週二 占星循環班現場照",
        "crop_box": (0, 100, 2364, 1577),  # 16:10
        "target_size": (960, 600),
    },
    "偉特塔羅.jpg": {
        "output": "courses_c_waite_v1.webp",
        "code": "課程-C",
        "name": "週三 偉特塔羅團練現場照",
        "crop_box": (0, 100, 1280, 900),   # 16:10
        "target_size": (960, 600),
    },
    "七脈輪與靈氣.png": {
        "output": "courses_d_reiki_v1.webp",
        "code": "課程-D",
        "name": "週四 七脈輪與靈氣現場照",
        "crop_box": (0, 320, 1093, 1003),  # 16:10 聚焦席地靜心圈
        "target_size": (960, 600),
    },
    "托特塔羅.jpg": {
        "output": "courses_e_thoth_v1.webp",
        "code": "課程-E",
        "name": "週五 托特塔羅循環班現場照",
        "crop_box": (0, 80, 1280, 880),    # 16:10
        "target_size": (960, 600),
    },
    "生命靈數.png": {
        "output": "courses_f_numerology_v1.webp",
        "code": "課程-F",
        "name": "週六 生命靈數循環班現場照",
        "crop_box": (0, 260, 866, 801),    # 16:10 聚焦白板算式與解說
        "target_size": (960, 600),
    },
    "命理交流會.png": {
        "output": "courses_g_meetup_v1.webp",
        "code": "課程-G",
        "name": "實體命理交流會現場照",
        "crop_box": (0, 80, 386, 466),     # 正方/4:3 聚會全景
        "target_size": (600, 600),
    },
}

def process_photo(input_path, output_name, crop_box=None, target_size=None, quality=85):
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    public_assets_dir = os.path.join(repo_root, "public", "assets")
    
    if "/" in output_name or "\\" in output_name or os.path.dirname(output_name):
        print(f"錯誤：--output 僅接受純檔名：{output_name}")
        sys.exit(1)
        
    if not output_name.lower().endswith(".webp"):
        output_name += ".webp"
        
    if not os.path.isabs(input_path):
        input_path = os.path.abspath(os.path.join(repo_root, input_path))
        
    if not os.path.exists(input_path):
        print(f"[-] 跳過：找不到輸入檔案 {input_path}")
        return None
        
    print(f"[*] 讀取照片: {os.path.basename(input_path)}")
    raw_size_kb = os.path.getsize(input_path) / 1024
    
    im = Image.open(input_path)
    im = ImageOps.exif_transpose(im)
    
    # 進行裁剪
    if crop_box:
        im = im.crop(crop_box)
        print(f"    - 套用自訂取景視窗: {crop_box}")
    else:
        # 若未指定 crop_box，預設維持或自動取短邊正方形
        w, h = im.size
        if w != h:
            min_dim = min(w, h)
            left = (w - min_dim) // 2
            top = (h - min_dim) // 2
            im = im.crop((left, top, left + min_dim, top + min_dim))
            
    # 等比縮放至 target size
    if target_size:
        if isinstance(target_size, tuple):
            im = im.resize(target_size, Image.Resampling.LANCZOS)
        elif isinstance(target_size, int):
            im = im.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
    out_im = im.convert("RGBA") if im.mode in ("RGBA", "LA") else im.convert("RGB")
    
    os.makedirs(public_assets_dir, exist_ok=True)
    dst_path = os.path.join(public_assets_dir, output_name)
    
    out_im.save(dst_path, "WEBP", quality=quality, method=6)
    out_size_kb = os.path.getsize(dst_path) / 1024
    reduction = ((raw_size_kb - out_size_kb) / raw_size_kb) * 100 if raw_size_kb > 0 else 0
    print(f"[+] 匯出成功: {output_name} ({im.size[0]}x{im.size[1]}, {out_size_kb:.1f} KB, -{reduction:.1f}%)")
    return dst_path

def batch_courses():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    courses_dir = os.path.join(repo_root, "demo_docs", "raw-photos", "courses")
    print(f"[*] 開始活動課程照片批次轉檔 (目錄: {courses_dir})...")
    count = 0
    for filename, cfg in COURSES_MAPPING.items():
        src_path = os.path.join(courses_dir, filename)
        if os.path.exists(src_path):
            process_photo(
                src_path,
                cfg["output"],
                crop_box=cfg.get("crop_box"),
                target_size=cfg.get("target_size", (960, 600)),
                quality=85
            )
            count += 1
        else:
            print(f"[-] 待補照片: {filename} ({cfg['name']})")
    print(f"[*] 課程照片批次轉檔完成，共處理 {count} 張照片。\n")

def batch_team():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    team_dir = os.path.join(repo_root, "demo_docs", "raw-photos", "team")
    print(f"[*] 開始團隊成員照片批次轉檔 (目錄: {team_dir})...")
    count = 0
    for filename, cfg in TEAM_MAPPING.items():
        src_path = os.path.join(team_dir, filename)
        if os.path.exists(src_path):
            process_photo(
                src_path,
                cfg["output"],
                crop_box=cfg.get("crop_box"),
                target_size=cfg.get("size", 600),
                quality=85
            )
            count += 1
        else:
            print(f"[-] 待補照片: {filename} ({cfg['name']})")
    print(f"[*] 批次轉檔完成，共處理 {count} 位成員照片。\n")

def main():
    parser = argparse.ArgumentParser(description="Starwoven 實拍素材轉 WebP 工具")
    parser.add_argument("-i", "--input", help="原始圖檔路徑")
    parser.add_argument("-o", "--output", help="輸出檔名 (如 about_b_founder_yien_v1.webp)")
    parser.add_argument("--size", type=int, default=600, help="正方形長寬像素 (預設 600)")
    parser.add_argument("--quality", type=int, default=85, help="WebP 壓縮品質 1-100 (預設 85)")
    parser.add_argument("--batch-team", action="store_true", help="一鍵批次處理 demo_docs/raw-photos/team/ 內所有夥伴照片")
    parser.add_argument("--batch-courses", action="store_true", help="一鍵批次處理 demo_docs/raw-photos/courses/ 內所有活動課程照片")
    args = parser.parse_args()
    
    if args.batch_team:
        batch_team()
    elif args.batch_courses:
        batch_courses()
    elif args.input and args.output:
        process_photo(args.input, args.output, target_size=args.size, quality=args.quality)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
