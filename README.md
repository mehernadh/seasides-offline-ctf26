# Seasides Offline CTF 2026

This repository contains 6 challenges (3 PWN and 3 Web) developed by Meherx0111, organized into two main categories: **PWN (Binary Exploitation)** and **Web (Web)**.

---

## Challenge Overview

| # | Category | Challenge Name |
|---|----------|----------------|
| 1 | [PWN](PWN/) | [Berry Counter](PWN/app/berry_counter/) |
| 2 | [PWN](PWN/) | [Colossal Leak](PWN/app/colossal_leak/) |
| 3 | [PWN](PWN/) | [The Last Check](PWN/app/the_last_check/) |
| 4 | [Web](Web/) | [Blindspot](Web/Blindspot/) |
| 5 | [Web](Web/) | [Project Nebula](Web/Project%20Nebula/) |
| 6 | [Web](Web/) | [Seasides Online Store](Web/Seasides%20Online%20Store/) |

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
- [PWN Terraform Guide](PWN/terraform_setup_guide.md)
- [Blindspot Terraform Guide](Web/Blindspot/terraform_setup_guide.md)
- [Project Nebula Terraform Guide](Web/Project%20Nebula/terraform_setup_guide.md)
- [Seasides Online Store Terraform Guide](Web/Seasides%20Online%20Store/terraform_setup_guide.md)

---

### Option 2: Manual Setup (Local Deployment)

Deploy challenges locally on your machine. Each challenge has a `manual_setup_guide.md` in its folder.

After deployment:
- **PWN challenges**: Connect with `nc localhost <PORT>`
- **Web challenges**: Open `http://localhost:<PORT>` in your browser

**Manual Setup Guides:**
- [PWN Manual Setup](PWN/app/manual_setup_guide.md)
- [Blindspot Manual Setup](Web/Blindspot/app/manual_setup_guide.md)
- [Project Nebula Manual Setup](Web/Project%20Nebula/manual_setup_guide.md)
- [Seasides Online Store Manual Setup](Web/Seasides%20Online%20Store/manual_setup_guide.md)

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
