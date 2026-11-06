# Phase 2 Data Migration Report

Generated: 2026-11-06T14:00:22.195Z
Execution Mode: **APPLY (Written to Supabase)**

## 1. Test Records Exclusions
- `2024-JEE-0842` (**Arjun S**): **Skipped (test record)** — excluded from updates, no columns modified.
- `EDU-2026-DEMO` (**Demo Student**): Only `subjects = ["General Tuition"]` updated. Board, school, fee, and joining date set to **NULL**.

## 2. School Normalizations Applied (5)

| Roll No | Name | Original School | Normalized School |
| :--- | :--- | :--- | :--- |
| `EDU-2026-022` | Karthik Nath | `CBSE` | ***NULL*** |
| `2024-JEE-0842` | Arjun S | `EduHome Campus` | ***NULL*** |
| `EDU-2026-036` | Cristine | `Divine cbse` | **Divine** |
| `EDU-2026-010` | Aromal | `Technical Scool` | **Technical School** |
| `EDU-2026-048` | Sreehari | `Divine School Puthoor` | **Divine** |

## 3. Placeholder Joining Dates Set to NULL (2)

| Roll No | Name | Original Date | Applied Value |
| :--- | :--- | :---: | :---: |
| `2024-JEE-0842` | Arjun S | `2026-01-15` | **NULL** |
| `EDU-2026-023` | Vishwathej | `2026-01-01` | **NULL** |

## 4. Final Per-Student Table (47 Students)

| Roll No | Name | Subjects | Board | Monthly Fee | Fee Status | School | Joining Date |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| `2024-JEE-0842` | **Arjun S** | *(skipped)* | *(skipped)* | *(skipped)* | *Skipped (test record)* | *(skipped)* | *(skipped)* |
| `EDU-2026-001` | **Amaljith** | Physics, Maths, Biology | State Syllabus | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-04-18 |
| `EDU-2026-002` | **Karthik** | Physics, Maths | State Syllabus | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | Boys | 2026-07-06 |
| `EDU-2026-003` | **Sivanya** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹4500 | Unverified (ADMIN-DIRECT-TOGGLE) | Boys | 2026-05-01 |
| `EDU-2026-004` | **Abhinanda** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-05-01 |
| `EDU-2026-005` | **Krishnaveni** | Maths | State Syllabus | ₹750 | Unverified (ADMIN-DIRECT-TOGGLE) | Puthoor | 2026-05-04 |
| `EDU-2026-007` | **Niranjana** | Physics | CBSE | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-05-23 |
| `EDU-2026-008` | **Vaiga** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹1500 | Unverified (ADMIN-DIRECT-TOGGLE) | Marthoma | 2026-05-23 |
| `EDU-2026-009` | **Sari S Raj** | Physics, Chemistry, Biology | State Syllabus | ₹3000 | Unverified (ADMIN-DIRECT-TOGGLE) | Boys VHSE | 2026-05-24 |
| `EDU-2026-010` | **Aromal** | Physics, Chemistry, Maths | State Syllabus | ₹1500 | Unverified (ADMIN-DIRECT-TOGGLE) | Technical School | 2026-04-08 |
| `EDU-2026-011` | **Vaishnavi** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹1500 | Verified | Siddhartha | 2026-04-05 |
| `EDU-2026-012` | **Avani** | Maths | State Syllabus | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Puthoor | 2026-04-06 |
| `EDU-2026-013` | **Nakshathra** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Marthoma | 2026-04-06 |
| `EDU-2026-014` | **Asna** | Physics, Maths | State Syllabus | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Marthoma | 2026-04-06 |
| `EDU-2026-015` | **Sivani** | Physics, Chemistry, Maths, Computer Science | State Syllabus | ₹4500 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-04-13 |
| `EDU-2026-016` | **Nandana** | Physics, Maths | CBSE | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | MIBS | 2026-04-08 |
| `EDU-2026-017` | **Karun** | Physics, Maths | CBSE | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-04-04 |
| `EDU-2026-018` | **Aadidev** | Physics, Maths | CBSE | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-04-04 |
| `EDU-2026-019` | **Abhinand** | Physics, Chemistry, Maths | State Syllabus | ₹3500 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-04-08 |
| `EDU-2026-020` | **Poojitha** | Maths | State Syllabus | ₹600 | Unverified (ADMIN-DIRECT-TOGGLE) | Kottathala UP School | 2026-05-04 |
| `EDU-2026-021` | **Irfan** | Physics, Maths, Computer Science | State Syllabus | ₹3500 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-05-14 |
| `EDU-2026-022` | **Karthik Nath** | Physics, Maths | CBSE | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | *NULL* | 2026-04-03 |
| `EDU-2026-023` | **Vishwathej** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹4500 | Unverified (ADMIN-DIRECT-TOGGLE) | SG | *NULL* |
| `EDU-2026-024` | **Ganga** | Physics, Chemistry, Maths, Biology | CBSE | ₹3000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-03-09 |
| `EDU-2026-025` | **Adithya Krishnan** | Physics, Chemistry, Maths, Biology | CBSE | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | MGM | 2026-05-31 |
| `EDU-2026-026` | **Alecia Mathew** | Physics, Chemistry, Maths, Biology | CBSE | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-03-13 |
| `EDU-2026-027` | **Krishnanandh** | Physics, Chemistry, Maths | CBSE | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Siddhartha | 2026-06-08 |
| `EDU-2026-028` | **Ashwanath** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹1500 | Unverified (ADMIN-DIRECT-TOGGLE) | Puthoor | 2026-04-05 |
| `EDU-2026-029` | **Niranjan** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹4500 | Unverified (ADMIN-DIRECT-TOGGLE) | SG | 2026-09-20 |
| `EDU-2026-030` | **Lekshmipriya** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Marthoma | 2026-05-07 |
| `EDU-2026-031` | **Achyuth** | Physics | CBSE | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-06-06 |
| `EDU-2026-032` | **Hiba** | Physics, Maths | CBSE | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | Brm | 2026-06-22 |
| `EDU-2026-033` | **Gautham** | Physics, Chemistry, Maths, Biology | CBSE | ₹2000 | Verified | Sree Sree | 2026-07-01 |
| `EDU-2026-034` | **Vyshnavi** | Physics | CBSE | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-07-11 |
| `EDU-2026-035` | **Gopika** | Maths | CBSE | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-07-15 |
| `EDU-2026-036` | **Cristine** | Physics, Chemistry, Maths, Biology | CBSE | ₹3000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-09-04 |
| `EDU-2026-038` | **Fathima** | Physics, Biology | State Syllabus | ₹2000 | Unverified (No payments) | Svmmhss | 2026-09-02 |
| `EDU-2026-039` | **Hajira** | Physics, Maths | State Syllabus | ₹2500 | Unverified (No payments) | Svmmhss | 2026-09-02 |
| `EDU-2026-040` | **Keerthana** | Physics, Chemistry | State Syllabus | ₹1000 | Unverified (ADMIN-DIRECT-TOGGLE) | Svmmhss | 2026-08-08 |
| `EDU-2026-041` | **Karthika** | Chemistry, Maths | State Syllabus | ₹2500 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-08-03 |
| `EDU-2026-043` | **Adarsh** | Physics, Chemistry | State Syllabus | ₹3000 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-08-08 |
| `EDU-2026-044` | **Sreedev** | Physics, Chemistry, Biology | State Syllabus | ₹3000 | Unverified (ADMIN-DIRECT-TOGGLE) | Vendar | 2026-08-08 |
| `EDU-2026-046` | **Amrutha** | Maths | State Syllabus | ₹1500 | Unverified (ADMIN-DIRECT-TOGGLE) | Puthoor | 2026-09-09 |
| `EDU-2026-047` | **Punya R** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹4500 | Unverified (ADMIN-DIRECT-TOGGLE) | EVHS Neduvathoor | 2026-09-11 |
| `EDU-2026-048` | **Sreehari** | Physics, Chemistry, Maths | CBSE | ₹2000 | Unverified (ADMIN-DIRECT-TOGGLE) | Divine | 2026-09-12 |
| `EDU-2026-049` | **Sivananda** | Physics, Chemistry, Maths, Biology | State Syllabus | ₹1000 | Verified (Admin confirmed ₹1,000) | MTGHS | 2026-06-01 |
| `EDU-2026-DEMO` | **Demo Student (Google Reviewer)** | General Tuition | *NULL* | *NULL* | N/A (Demo record) | *NULL* | *NULL* |
