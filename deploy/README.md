# VPS deployment

Target: Hostinger VPS `srv1151611`, `72.60.25.131`; domain `videovitannya.com.ua` and its `www` alias.

Live since 2026-11-18: **https://videovitannya.com.ua/**. Current application release: `eb701eb`, `ROUTING_ENABLED=true`; previous release `825202a` is retained for rollback. The container is healthy. Let's Encrypt issued a certificate for both names, valid through 2027-02-16; renewal is handled by the existing Traefik resolver. Existing MX and SPF records were retained.

Release `eb701eb` applies the owner's Ukrainian page copy and FAQ updates, including the clarified one-minute photo animation time and removal of the song waiting-time question. Mykolay uses a separate order per recipient. Previous MP4-only playback and responsive image fixes remain in place. All 26 desktop/mobile browser tests passed against the public HTTPS domain after deployment. Public HTML for the home page, four visible products and prices matches the tested build exactly; noindex remains enabled and New Year stays hidden. Uploaded archive SHA-256: `043935ab6b00e7ffa54f4e77aeb3891fe365093b181ddaa81f960271d6bbae94`.

The application is a separate Docker Compose project at `/opt/videovitannya`. It uses the existing Traefik proxy and its `letsencrypt-http` certificate resolver. No existing containers, proxy configuration, host port bindings or DNS mail records are replaced.

## Layout

- `compose.yaml` — the configuration in this directory, copied to `/opt/videovitannya/compose.yaml`.
- `deploy.env` — server-local values: `RELEASE`, the pinned `NODE_IMAGE` digest, and `ROUTING_ENABLED`.
- `releases/eb701eb/` — current prebuilt site, production Node server and its content modules. No runtime npm install is needed.
- `releases/825202a/` and `deploy.env.before-eb701eb` — previous application release and deployment settings for rollback. The initial `66152d2` release is also retained.
- `incoming/` — verified release archive.

Initial Node image: `node@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5` (official Node 24 Alpine).

The process runs as the container's `node` user. The release is mounted read-only, no host ports are published, privileges are dropped, and Docker restarts the service after a host reboot. Traefik reaches it over the dedicated `videovitannya_application` network.

## Activation

For a fresh installation, stage with `ROUTING_ENABLED=false` while the domain still points elsewhere. Point the apex and `www` A records to `72.60.25.131`. Keep nameservers and all unrelated DNS records, especially MX and SPF/DKIM/DMARC TXT, unchanged. This initial activation is already complete on the target VPS.

After authoritative DNS resolves both names to the VPS, set `ROUTING_ENABLED=true` in `/opt/videovitannya/deploy.env` and run:

```sh
cd /opt/videovitannya
docker compose --env-file deploy.env up -d
docker compose --env-file deploy.env ps
```

Traefik obtains a certificate using its existing HTTP challenge resolver. Verify HTTPS without disabling certificate validation. The shared proxy redirects HTTP to HTTPS; the application redirects `www` to the apex domain.

## Verification and rollback

For sandbox checkout include `lib/plata-test.mjs` in the server release alongside `lib/serve-video.mjs` and the content modules including `src/birthday.mjs`. Set `MONO_TEST_TOKEN` to the sandbox token in `/opt/videovitannya/.env.mono-test` (mode 600), then recreate the web service. The root-level local secret files are excluded from release archives. Compose sets the HTTPS return origin and mounts a persistent volume for test invoice references. The web process stores the gift, price and bank invoice identifiers there. `GET /api/plata/config` reports whether a test token is configured. Confirm a sandbox checkout by returning from mono to `/oplata/` and checking the bank-confirmed status.

Verify `/`, `/svyatyj-mykolaj/`, `/tsiny/`, `/robots.txt`, `/sitemap.xml` and byte-range responses for both MP4 sizes. All responses currently carry `X-Robots-Tag: noindex, nofollow`; rendered HTML also contains noindex. Sitemap has no URLs, and `/novyj-rik/` returns 404 while Santa is hidden.

For a future release, upload to a new directory, verify the archive checksum, change `RELEASE`, then recreate only this Compose project's web service. Preserve the prior release so rollback only requires selecting the prior `RELEASE` value and running the same `up -d` command. Never run a host-wide Docker cleanup as part of deployment.

Temporary indexing and catalogue controls live in `src/features.mjs`. Changing them requires a new build and deployment. Deployment is manual; GitHub auto-deployment is not configured.
