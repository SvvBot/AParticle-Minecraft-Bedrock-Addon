# AParticle (Amuletcraft Particles)

## English

**AParticle** is a high-performance parametric particle spawner addon for Minecraft Bedrock Edition developed by Amuletcraft. It evaluates mathematical expressions dynamically and spawns particle shapes asynchronously using timeline management to ensure smooth, lag-free gameplay.

### 🚀 Features
*   **Parametric Particle Shapes:** Define coordinate equations (X, Y, Z) dynamically using variables such as `t` (e.g., circles, helices, spheres, and hearts).
*   **RPN Evaluation Engine:** Fully tokenizes and evaluates mathematical expressions using memory pools to minimize garbage collection spikes.
*   **Asynchronous Spawning (Timeline):** Distributes spawning points across multiple game ticks, preventing server TPS drops and lag.
*   **Chunked Registry Persistence:** Automatically partitions and persists saved mathematical functions and groups across world restarts using chunked dynamic properties (bypassing Bedrock's 32KB storage limits).
*   **Smart Settings System:** Toggles player action bar alerts and server console logging dynamically, ideal for public multiplayer servers.

### 📖 Usage and Commands
For the full detailed documentation, syntax rules, math functions, and geometry formulas, check out:
👉 [**AParticle Detailed Guide**](./aparticle_guide.md)

#### Quick Commands Reference:
*   `/aparticle:spawn <coords> <expr_x> <expr_y> <expr_z> [particle] [step] [range]` - Spawns a shape dynamically relative to absolute or facing coordinates.
*   `/aparticle:save <name> <expr_x> <expr_y> <expr_z>` - Saves a function configurations permanently.
*   `/aparticle:play <name> [coords]` - Plays a saved function or staggered group.
*   `/aparticle:savegroup <name> <functions> [delay]` - Saves a staggered queue of animations.
*   `/aparticle:list` - Lists saved configurations and active timeline processes.
*   `/aparticle:stop` - Instantly cancels all running particle processes.
*   `/aparticle:setting [name] [value]` - Configures server console/action bar warnings.

---

[**คู่มือภาษาไทย (Thai Guide)**](#ภาษาไทย-thai) | [**English Guide**](#english)

---

## ภาษาไทย (Thai)

**AParticle** เป็นแอดออนสำหรับ Minecraft Bedrock Edition (พัฒนาโดย Amuletcraft) ที่ช่วยให้สามารถสร้างเอฟเฟกต์ Particle ตามสมการคณิตศาสตร์แบบ Parametric ความเร็วสูงและลดอาการกระตุก (Lag-Free) โดยตัวแอดออนรองรับการบันทึกคีย์ข้อมูลลงโลกถาวรและปรับแต่งการแสดงผลได้อย่างอิสระ

### 🚀 ฟีเจอร์หลัก
*   **สมการคณิตศาสตร์แบบพารามิเตอร์ (Parametric Equations):** คำนวณแกน X, Y, Z บนตัวแปรเวลา `t` แบบสดๆ (เช่น วงกลม, รูปหัวใจ, ทรงกลม)
*   **ระบบคำนวณ RPN (Reverse Polish Notation):** แปลงสมการปกติไปประมวลผลความเร็วสูงผ่าน Object Pool เพื่อไม่ให้สร้างขยะในระบบหน่วยความจำ
*   **การกระจายโหลดงาน (Timeline Tick Loop):** สปอว์นจุดแบบกระจายตัวตามคาบเวลา เพื่อป้องกันอาการ FPS ตกชั่วคราว
*   **การบันทึกค่าลงเซฟโลกถาวร (Persistent Chunked Storage):** บันทึกสูตรและคีย์แอนิเมชันถาวรโดยระบบการขยายพื้นที่เก็บข้อมูลข้ามคีย์ (Chunking) เพื่อทลายขีดจำกัด 32KB ของตัวเกม
*   **การตั้งค่าดีบั๊กอัจฉริยะ (Settings Control):** ปิด/เปิด การแจ้งเตือนบนแถบหน้าจอผู้เล่น (Actionbar) และ Console Log ได้อิสระ เหมาะสำหรับนำไปเปิดเป็นสาธารณะ

### 📖 การใช้งานและคำสั่ง
สำหรับคู่มืออย่างละเอียด การเขียนสูตรคณิตศาสตร์ และรูปทรงต่าง ๆ สามารถเข้าไปดูได้ที่:
👉 [**AParticle Detailed Guide (คู่มือการใช้งานแบบละเอียด)**](./aparticle_guide.md) หรือเปิดผ่านไฟล์ [aparticle_guide.md](./aparticle_guide.md)

#### คำสั่งย่อ:
*   `/aparticle:spawn <coords> <expr_x> <expr_y> <expr_z> [particle] [step] [range]` - สปอว์นรูปทรงสดตามตำแหน่งและมุมการหันหน้า
*   `/aparticle:save <name> <expr_x> <expr_y> <expr_z>` - บันทึกสมการถาวร
*   `/aparticle:play <name> [coords]` - เล่นสมการหรือกลุ่มแอนิเมชันที่บันทึกไว้
*   `/aparticle:savegroup <name> <functions> [delay]` - บันทึกกลุ่มคิวแสดงผล staggered
*   `/aparticle:list` - แสดงรายการที่บันทึกและสถานะงานค้าง
*   `/aparticle:stop` - สั่งยกเลิกงานทั้งหมดทันที
*   `/aparticle:setting [name] [value]` - ดูหรือเปลี่ยนแปลงการตั้งค่าของโลก

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
