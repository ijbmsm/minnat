#!/usr/bin/env python3
"""새 Supabase 프로젝트 키를 로컬 .env 파일과 GitHub secrets 에 반영한다.

키를 화면에 찍지 않고 입력받아 파일만 고친다.
Supabase 대시보드 → Project Settings → API 에서 세 값을 복사해 둘 것.

사용: python3 minnat/scripts/set-supabase-keys.py
"""
import getpass
import re
import shutil
import subprocess
import sys
from pathlib import Path

FRONT_ENV = Path("/Users/sungmin/minnat/.env.local")
CRAWLER_ENV = Path("/Users/sungmin/minnat-crawler/.env")
CRAWLER_REPO = "ijbmsm/minnat-crawler"


def upsert(path: Path, key: str, value: str) -> str:
    """.env 파일에서 key 를 갱신하거나 없으면 추가한다."""
    if not path.exists():
        path.write_text("")
    text = path.read_text()
    line = f"{key}={value}"
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(text):
        text = pattern.sub(line, text)
        action = "갱신"
    else:
        text = text.rstrip("\n") + "\n" + line + "\n"
        action = "추가"
    path.write_text(text)
    return action


def main() -> int:
    print("Supabase 대시보드 → Project Settings → API 의 값을 입력하세요.")
    print("(키 입력은 화면에 표시되지 않습니다)\n")

    url = input("Project URL (https://xxxx.supabase.co): ").strip().rstrip("/")
    if not re.fullmatch(r"https://[a-z0-9]+\.supabase\.co", url):
        print(f"[중단] URL 형식이 이상합니다: {url!r}")
        return 1

    anon = getpass.getpass("anon public key: ").strip()
    service = getpass.getpass("service_role secret key: ").strip()
    if not anon or not service:
        print("[중단] 키가 비어 있습니다")
        return 1
    if anon == service:
        print("[중단] anon 과 service_role 이 같습니다. 다시 확인하세요")
        return 1

    for path in (FRONT_ENV, CRAWLER_ENV):
        if path.exists():
            backup = path.with_suffix(path.suffix + ".bak")
            shutil.copy2(path, backup)
            print(f"  백업: {backup}")

    print("\n── 로컬 .env ──")
    for key, val in (("NEXT_PUBLIC_SUPABASE_URL", url), ("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon)):
        print(f"  {FRONT_ENV.name}: {key} {upsert(FRONT_ENV, key, val)}")
    for key, val in (("SUPABASE_URL", url), ("SUPABASE_SERVICE_KEY", service)):
        print(f"  {CRAWLER_ENV.name}: {key} {upsert(CRAWLER_ENV, key, val)}")

    print("\n── GitHub secrets ──")
    for key, val in (("SUPABASE_URL", url), ("SUPABASE_SERVICE_KEY", service)):
        r = subprocess.run(
            ["gh", "secret", "set", key, "--repo", CRAWLER_REPO],
            input=val, text=True, capture_output=True,
        )
        print(f"  {key}: {'OK' if r.returncode == 0 else '실패 — ' + r.stderr.strip()}")

    print("""
── 남은 작업 (수동) ──
  1. SQL Editor 에 minnat/supabase/SETUP.sql 전체를 붙여넣고 실행
  2. (선택) SEED.sql 실행
  3. Vercel → minnat 프로젝트 → Settings → Environment Variables 에
     NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 갱신 후 재배포
  4. 검증: cd minnat-crawler && .venv/bin/python main.py
""")
    return 0


if __name__ == "__main__":
    sys.exit(main())
