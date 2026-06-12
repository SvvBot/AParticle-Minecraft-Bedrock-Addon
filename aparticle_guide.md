# AParticle (Amuletcraft Particles) - Detailed Guide / คู่มือการใช้งานแบบละเอียด

Choose Language / เลือกภาษา:
- [**English Version**](#english-version)
- [**ภาษาไทย (Thai Version)**](#ภาษาไทย-thai-version)

---

# English Version

Welcome to the official detailed guide for **AParticle**, a high-performance parametric particle spawner behavior pack developed by **Amuletcraft**.

This addon allows you to render complex mathematical paths, curves, and shapes in Minecraft Bedrock using parametric equations in real-time, safely managed through asynchronous ticking and pooling systems.

---

## 1. Commands Reference

All commands must be executed by a user with Game Director permissions. The base command prefix is `/aparticle:`.

### 1.1 /aparticle:spawn
Spawns a parametric particle curve dynamically at a specified location.
```text
/aparticle:spawn <coords> <expr_x> <expr_y> <expr_z> [particle] [step] [range]
```
- **`coords`** (Mandatory): Space-separated coordinates. Supports relative (`~ ~ ~`) and local facing coordinates (`^ ^ ^`). If carets (`^`) are used, the particle shape rotates dynamically to match the player's facing direction.
- **`expr_x` / `expr_y` / `expr_z`** (Mandatory): Mathematical infix expressions using `t` as the parameter variable (e.g., `cos(t)*2`).
- **`particle`** (Optional): Particle namespace identifier. Defaults to `minecraft:basic_flame_particle`.
- **`step`** (Optional): Step increment value for `t` per point. Defaults to `0.1`. Minimum limit is `0.05` for safety.
- **`range`** (Optional): Upper bound for parameter `t` (from `0` to `range`). Defaults to `6.28` (\(2\pi\)).

---

### 1.2 /aparticle:save
Saves a parametric equation configuration permanently in the world database.
```text
/aparticle:save <name> <expr_x> <expr_y> <expr_z> [particle] [step] [range]
```
- **`name`**: Unique identifier for the saved function (case-insensitive).
- *Note: Only infix math expressions and metadata are saved to conserve disk space, RPN matrices are compiled once at world startup.*

---

### 1.3 /aparticle:play
Plays a saved parametric function or staggered animation group.
```text
/aparticle:play <name> [coords]
```
- **`name`**: The name of the saved function or animation group.
- **`coords`** (Optional): Location to play. If omitted, defaults to the executor's feet level (`~ ~ ~`).

---

### 1.4 /aparticle:savegroup
Saves an animation group to trigger multiple functions sequentially or simultaneously.
```text
/aparticle:savegroup <group_name> <functions> [delay]
```
- **`functions`**: Comma-separated list of previously saved function names (e.g., `spiral,circle,lines`).
- **`delay`** (Optional): Time offset interval between each function starting, in seconds. (e.g., `0.5` = staggered delay of 10 game ticks).

---

### 1.5 /aparticle:group
Plays multiple saved functions with staggered delays on-the-fly without saving.
```text
/aparticle:group <names> [delay] [coords]
```

---

### 1.6 /aparticle:delete
Deletes a saved function or group from the world database.
```text
/aparticle:delete <name>
```

---

### 1.7 /aparticle:list
Lists all saved functions, saved groups, active processes running on the timeline (Active Jobs), and scheduled staggered delays (Pending Jobs).

---

### 1.8 /aparticle:stop
Instantly terminates all active and pending particle spawning processes on the server. Use this to clear lag or remove unwanted running animations.

---

### 1.9 /aparticle:debug
Shows engine metrics: Object pooling statistics (VectorPool and ArrayPool acquisition rates) and Dynamic Batch sizes adjusted by the tick performance scheduler.

---

### 1.10 /aparticle:setting
Displays or changes global configuration variables.
```text
/aparticle:setting [name] [value]
```
- **No arguments**: Prints current setting variables.
- **With arguments**: Configures the setting. Supports:
  - `debug_console` (`true`/`false`): Toggle printing script warning logs to the server console.
  - `debug_actionbar` (`true`/`false`): Toggle sending success/error alerts to the player's action bar.

---

## 2. Mathematical Expression Syntax

The mathematical evaluator tokenizes and parses math inputs into **Reverse Polish Notation (RPN)**. 

### 2.1 Operators & Constants
- `+`, `-`, `*`, `/`, `^` (power)
- `pi` (\(\approx 3.14159\))
- `e` (\(\approx 2.71828\))
- `t` (parameter variable traversing from `0` to `range` by `step` increments)

### 2.2 Built-in Functions
- **Trigonometric**: `sin(t)`, `cos(t)`, `tan(t)`, `atan2(y, x)`
- **Algebraic**: `sqrt(t)`, `abs(t)`, `pow(base, exp)`, `exp(t)`
- **Rounding**: `floor(t)`, `ceil(t)`, `round(t)`
- **Comparison & Log**: `min(a, b)`, `max(a, b)`, `log(t)`

*Implicit multiplication is supported (e.g., `2t` $\rightarrow$ `2*t` and `3cos(t)` $\rightarrow$ `3*cos(t)`).*

---

## 3. Parametric Presets (Copy & Paste)

### 3.1 Flat Circle (XY plane)
- X: `cos(t)*2`
- Y: `0`
- Z: `sin(t)*2`
- Range: `6.28`

### 3.2 3D Spiral Cylinder (Helix)
- X: `cos(t*2)*1.5`
- Y: `t*0.5`
- Z: `sin(t*2)*1.5`
- Range: `10`

### 3.3 Heart Shape (Vertical Flat)
- X: `16 * pow(sin(t), 3) * 0.1`
- Y: `(13 * cos(t) - 5 * cos(2*t) - 2 * cos(3*t) - cos(4*t)) * 0.1`
- Z: `0`
- Range: `6.28`

### 3.4 Star-patterned Sphere Wireframe
- X: `cos(t)*cos(t*8)*2`
- Y: `sin(t)*2`
- Z: `cos(t)*sin(t*8)*2`
- Range: `3.14`

---
---

# ภาษาไทย (Thai Version)

ยินดีต้อนรับสู่คู่มือการใช้งานแบบละเอียดของ **AParticle** แอดออนพาร์ติเคิลเชิงคณิตศาสตร์ประสิทธิภาพสูง พัฒนาโดย **Amuletcraft**

แอดออนนี้ช่วยให้คุณสร้างรูปทรง เส้นโค้ง หรือเอฟเฟกต์ 3 มิติสุดอลังการใน Minecraft Bedrock โดยป้อนสมการพารามิเตอร์ผ่านชุดคำสั่งในเกม ทำงานบนระบบคิว Tick Loop และคลังเก็บข้อมูลแบบออฟเจกต์ (Object Pool) เพื่อป้องกันอาการแลคอย่างสมบูรณ์

---

## 1. ข้อมูลชุดคำสั่ง (Commands Reference)

คำสั่งทั้งหมดสามารถสั่งงานได้โดยผู้เล่นระดับผู้ดูแลระบบ (Game Directors) ผ่านคำนำหน้า `/aparticle:`

### 1.1 /aparticle:spawn
สปอว์นพาร์ติเคิลตามสมการคณิตศาสตร์สดๆ ณ พิกัดที่ระบุ
```text
/aparticle:spawn <coords> <expr_x> <expr_y> <expr_z> [particle] [step] [range]
```
- **`coords`** (จำเป็น): พิกัดเป้าหมาย รองรับพิกัดสัมพัทธ์ (`~ ~ ~`) และพิกัดมุมหันหน้าของผู้เล่น (`^ ^ ^`) หากใช้มุมหันหน้า (`^`) รูปทรงคณิตศาสตร์จะหมุนตามทิศทางหันมองของกล้องผู้เล่นโดยอัตโนมัติ
- **`expr_x` / `expr_y` / `expr_z`** (จำเป็น): สมการคณิตศาสตร์ในรูปแบบ Infix โดยใช้ตัวแปร `t` (เช่น `cos(t)*2`)
- **`particle`** (ไม่บังคับ): ID พาร์ติเคิลของตัวเกม ค่าเริ่มต้นคือ `minecraft:basic_flame_particle`
- **`step`** (ไม่บังคับ): ระยะห่างระหว่างจุดต่อจุด ค่าเริ่มต้นคือ `0.1` (ห้ามต่ำกว่า `0.05` เพื่อความปลอดภัย)
- **`range`** (ไม่บังคับ): ขอบเขตจุดเริ่มต้นถึงจุดสิ้นสุดของ `t` (0 ถึง ค่าสูงสุด) ค่าเริ่มต้นคือ `6.28` (\(2\pi\))

---

### 1.2 /aparticle:save
บันทึกสูตรสมการคณิตศาสตร์ลงเซฟโลกอย่างถาวร
```text
/aparticle:save <name> <expr_x> <expr_y> <expr_z> [particle] [step] [range]
```
- **`name`**: ชื่อสำหรับอ้างอิงสูตร (ตัวอักษรเล็กหรือใหญ่จะถูกแปลงเป็นพิมพ์เล็กทั้งหมด)
- *หมายเหตุ: ระบบจะเก็บบันทึกเพียงสูตรตัวอักษรดิบเพื่อจำกัดขนาดของเซฟโลก ส่วน RPN Arrays จะถูกแปลงตอนเริ่มเข้าเกม*

---

### 1.3 /aparticle:play
เล่นสูตรสมการเดี่ยวหรือกลุ่มแอนิเมชันที่บันทึกไว้ในโลก
```text
/aparticle:play <name> [coords]
```
- **`name`**: ชื่อของสูตรหรือชื่อกลุ่มแอนิเมชันที่ต้องการเรียกแสดงผล
- **`coords`** (ไม่บังคับ): พิกัดเป้าหมาย หากไม่กำหนดจะแสดงผลที่ตำแหน่งเท้าของผู้รันคำสั่ง

---

### 1.4 /aparticle:savegroup
บันทึกกลุ่มคิวแสดงผล staggered เพื่อรันแอนิเมชันหลายตัวพร้อมกันหรือสลับเวลา
```text
/aparticle:savegroup <group_name> <functions> [delay]
```
- **`functions`**: รายชื่อฟังก์ชันสะกดคั่นด้วยจุลภาค `,` (เช่น `circle1,spiral,circle2`)
- **`delay`** (ไม่บังคับ): ระยะหน่วงเวลาในการสปอว์นแต่ละฟังก์ชันเป็นวินาที (เช่น `0.5` = หน่วงเวลา 10 Ticks)

---

### 1.5 /aparticle:group
รันกลุ่มสมการคณิตศาสตร์และกำหนดเวลาหน่วงแบบสดๆ โดยไม่ต้องทำการบันทึก
```text
/aparticle:group <names> [delay] [coords]
```

---

### 1.6 /aparticle:delete
ลบฟังก์ชันเดี่ยวหรือกลุ่มแอนิเมชันที่บันทึกไว้ออกจากโลกถาวร
```text
/aparticle:delete <name>
```

---

### 1.7 /aparticle:list
แสดงรายการสมการกลุ่มและเดี่ยวทั้งหมดที่บันทึกไว้ พร้อมรายงานคิวแสดงผลปัจจุบัน (Active/Pending Jobs)

---

### 1.8 /aparticle:stop
ยกเลิกงานสปอว์นพาร์ติเคิลทั้งหมดบนเซิร์ฟเวอร์ทันทีเพื่อล้างคิวงานแลค

---

### 1.9 /aparticle:debug
แสดงการรายงานหน่วยความจำ VectorPool, ArrayPool และค่าประมวลผลความเร็ว Dynamic Batch

---

### 1.10 /aparticle:setting
แสดงผลหรือกำหนดค่าระบบต่างๆ ลงโลกถาวร
```text
/aparticle:setting [name] [value]
```
- **ไม่ระบุอาร์กิวเมนต์**: เรียกดูค่าตั้งค่าปัจจุบัน
- **กำหนดอาร์กิวเมนต์**: ปรับเปลี่ยนค่าดีบั๊กของระบบ ประกอบด้วย:
  - `debug_console` (`true`/`false`): ปิด/เปิด การแจ้งเตือนและเออเรอร์ลงไปยัง Server Console
  - `debug_actionbar` (`true`/`false`): ปิด/เปิด การสป็อปข้อความรายงานผลบน Actionbar ของหน้าจอผู้เล่น (แนะนำให้ปิดเมื่อเป็นเซิร์ฟเวอร์สาธารณะ)

---

## 2. ไวยากรณ์ของสมการคณิตศาสตร์

ตัวประมวลผลประเมินสมการแบบ **Reverse Polish Notation (RPN)** ที่รวดเร็วและประหยัดทรัพยากร

### 2.1 เครื่องหมายและค่าคงที่
- `+`, `-`, `*`, `/`, `^` (ยกกำลัง)
- `pi` (\(\approx 3.14159\))
- `e` (\(\approx 2.71828\))
- `t` (ตัวแปรวิ่งจาก `0` ถึงค่า `range` เพิ่มขึ้นทีละ `step`)

### 2.2 ฟังก์ชันทางคณิตศาสตร์
- **ตรีโกณมิติ**: `sin(t)`, `cos(t)`, `tan(t)`, `atan2(y, x)`
- **พีชคณิต**: `sqrt(t)`, `abs(t)`, `pow(base, exp)`, `exp(t)`
- **การปัดเศษ**: `floor(t)`, `ceil(t)`, `round(t)`
- **การเปรียบเทียบและลอการิทึม**: `min(a, b)`, `max(a, b)`, `log(t)`

*รองรับการคูณแบบละเครื่องหมาย (Implicit Multiplication) เช่น `2t` แทน `2*t` และ `5sin(t)` แทน `5*sin(t)`*

---

## 3. ตัวอย่างสูตรเด็ดสร้างรูปทรง (คัดลอกไปวางได้เลย)

### 3.1 วงกลมแนวราบ (วงแหวนเวทมนตร์)
- X: `cos(t)*2`
- Y: `0`
- Z: `sin(t)*2`
- Range: `6.28`

### 3.2 เกลียวคลื่นพุ่งขึ้นฟ้า (Helix Tornado)
- X: `cos(t*2)*1.5`
- Y: `t*0.5`
- Z: `sin(t*2)*1.5`
- Range: `10`

### 3.3 เอฟเฟกต์รูปทรงหัวใจแนวตั้ง
- X: `16 * pow(sin(t), 3) * 0.1`
- Y: `(13 * cos(t) - 5 * cos(2*t) - 2 * cos(3*t) - cos(4*t)) * 0.1`
- Z: `0`
- Range: `6.28`

### 3.4 ทรงกลมลวดลายตาข่ายดวงดาว (Sphere)
- X: `cos(t)*cos(t*8)*2`
- Y: `sin(t)*2`
- Z: `cos(t)*sin(t*8)*2`
- Range: `3.14`
