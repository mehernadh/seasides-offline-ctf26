# Seasides Offline CTF 2026

This repository contains 6 challenges (3 PWN and 3 Web) developed by Meherx0111, organized into two main categories: **PWN (Binary Exploitation)** and **Web (Web)**.

---

## Challenge Overview


| # | Category | Challenge Name | Writeup |
|---|----------|----------------|---------|
| 1 | PWN | [Berry Counter](PWN/app/berry_counter/) | [Writeup](PWN/app/berry_counter/Writeup.md) |
| 2 | PWN | [Colossal Leak](PWN/app/colossal_leak/) | [Writeup](PWN/app/colossal_leak/Writeup.md) |
| 3 | PWN | [The Last Check](PWN/app/the_last_check/) | [Writeup](PWN/app/the_last_check/Writeup.md) |
| 4 | Web | [Blindspot](Web/Blindspot/) | [Writeup](Web/Blindspot/Writeup.md) |
| 5 | Web | [Project Nebula](Web/Project%20Nebula/) | [Writeup](Web/Project%20Nebula/Writeup.md) |
| 6 | Web | [Seasides Online Store](Web/Seasides%20Online%20Store/) | [Writeup](Web/Seasides%20Online%20Store/Writeup.md) |

---

## Flag Format

All flags follow the format: `SEASIDES{...}`

---

##  Deployment Methods

### Option 1: Terraform (AWS Deployment - Recommended)

Automatically deploy all challenges on AWS EC2 using Terraform scripts. Each challenge category has its own Terraform configuration and setup guide.

After deployment:
- Terraform outputs will display the **EC2 Public IP**
- **PWN challenges**: Connect with `nc <EC2_IP> <PORT>`
- **Web challenges**: Open `http://<EC2_IP>:<PORT>` in your browser

**Terraform Setup Guides:**
| Category | Challenge Name | Guide Location |
|----------|----------------|----------------|
| PWN | All PWN Challenges | [terraform_setup_guide.md](PWN/terraform_setup_guide.md) |
| Web | Blindspot | [terraform_setup_guide.md](Web/Blindspot/terraform_setup_guide.md) |
| Web | Project Nebula | [terraform_setup_guide.md](Web/Project%20Nebula/terraform_setup_guide.md) |
| Web | Seasides Online Store | [terraform_setup_guide.md](Web/Seasides%20Online%20Store/terraform_setup_guide.md) |

---

### Option 2: Manual Setup (Local Deployment)

Deploy challenges locally on your machine. Each challenge has a `manual_setup_guide.md` in its folder.

After deployment:
- **PWN challenges**: Connect with `nc localhost <PORT>`
- **Web challenges**: Open `http://localhost:<PORT>` in your browser

**Manual Setup Guides:**
| Category | Challenge Name | Guide Location |
|----------|----------------|----------------|
| PWN | All PWN Challenges | [manual_setup_guide.md](PWN/app/manual_setup_guide.md) |
| Web | Blindspot | [manual_setup_guide.md](Web/Blindspot/app/manual_setup_guide.md) |
| Web | Project Nebula | [manual_setup_guide.md](Web/Project%20Nebula/manual_setup_guide.md) |
| Web | Seasides Online Store | [manual_setup_guide.md](Web/Seasides%20Online%20Store/manual_setup_guide.md) |

---

## Repository Structure

```
seasides-offline-ctf26-meherx0111/
├── README.md                          # Current file
├── PWN/                               # PWN Challenges
│   ├── terraform_setup_guide.md
│   ├── app/                        
│   │   ├── manual_setup_guide.md 
│   │   ├── berry_counter/             # Berry Counter challenge
│   │   ├── colossal_leak/             # Colossal Leak challenge
│   │   └── the_last_check/            # The Last Check challenge
│   └── terraform/
├── Web/                               # Web Challenges
│   ├── Blindspot/                     # Blindspot challenge
│   │   ├── terraform_setup_guide.md
│   │   ├── app/
│   │   │   └── manual_setup_guide.md
│   │   └── terraform/
│   ├── Project Nebula/                # Project Nebula challenge
│   │   ├── terraform_setup_guide.md
│   │   ├── app/
│   │   │   └── manual_setup_guide.md
│   │   └── terraform/
│   └── Seasides Online Store/         # Seasides Online Store challenge
│       ├── terraform_setup_guide.md
│       ├── app/
│       │   └── manual_setup_guide.md
│       └── terraform/
```

---

**All the Best!**
