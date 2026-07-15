# مانیتور هفتگی سلامت سایت ایران

## هدف

بررسی خودکار هفتگی سلامت آینهٔ ایران (`ir.llm.persiantoolbox.ir`) شامل وب‌سرور، fail2ban، فایل‌های ضروری و منابع سیستم.

## پیاده‌سازی

یک systemd timer روی سرور ایران (۱۹۳.۹۳.۱۶۹.۳۲) هر دوشنبه ساعت ۰۶:۰۰ به وقت تهران اجرا می‌شود.

### سرویس

```
/etc/systemd/system/iran-site-monitor.service
```

```ini
[Unit]
Description=Iran site weekly health monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/iran-site-monitor.sh
User=root
```

### تایمر

```
/etc/systemd/system/iran-site-monitor.timer
```

```ini
[Unit]
Description=Weekly Iran site health monitor
Requires=iran-site-monitor.service

[Timer]
OnCalendar=Mon *-*-* 06:00:00 Asia/Tehran
Persistent=true
RandomizedDelaySec=1800

[Install]
WantedBy=timers.target
```

### اسکریپت

```
/usr/local/bin/iran-site-monitor.sh
```

موارد بررسی:

| آزمون | توضیح |
|---|---|
| nginx active | سرویس nginx در حال اجراست؟ |
| fail2ban active | سرویس fail2ban فعال است؟ |
| site dir exists | لینک `current` در مسیر انتشار وجود دارد؟ |
| build-meta.json | فایل متادیتای build در دسترس است؟ |
| catalog.json | فایل کاتالوگ در دسترس است؟ |
| fail2ban sshd | آمار jail sshd (Currently failed, Total failed, Banned IP) |
| fail2ban recidive | آمار jail recidive |
| disk | درصد استفاده از دیسک |
| memory | میزان مصرف RAM |

### وضعیت

```bash
systemctl status iran-site-monitor.timer
systemctl status iran-site-monitor.service
```

### مشاهدهٔ آخرین خروجی

```bash
journalctl -u iran-site-monitor.service --since "1 week ago"
```

### غیرفعال کردن موقت

```bash
sudo systemctl stop iran-site-monitor.timer
sudo systemctl disable iran-site-monitor.timer
```

## fail2ban

دو jail روی سرور ایران فعال است:

| Jail | وضعیت | توضیح |
|---|---|---|
| sshd | ✅ فعال | ۱۹۵ تلاش ناموفق، ۱ IP مسدود (۵۱.۷۵.۷۶.۲۲۷) |
| recidive | ✅ فعال | ۰ مسدود (هنوز نیاز به تکرار نداشته) |

fail2ban از لاگ‌های systemd (`_SYSTEMD_UNIT=sshd.service`) تغذیه می‌کند. IPهای تکرارشونده پس از رسیدن به آستانه به recidive منتقل می‌شوند.

## گزارش‌دهی

در حال حاضر خروجی مانیتور فقط در journalctl ثبت می‌شود. در نسخه‌های بعدی می‌توان ارسال خودکار گزارش به Telegram (از طریق Hermes) یا ایمیل را اضافه کرد.
