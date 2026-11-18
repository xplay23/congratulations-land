# VPS deployment

Target: Hostinger VPS `srv1151611`, `72.60.25.131`; domain `videovitannya.com.ua` and its `www` alias.

Live since 2026-11-18: **https://videovitannya.com.ua/**. Current application release: `825202a`, `ROUTING_ENABLED=true`; previous release `66152d2` is retained for rollback. The container is healthy. Let's Encrypt issued a certificate for both names, valid through 2027-02-16; renewal is handled by the existing Traefik resolver. Existing MX and SPF records were retained.

Release `825202a` updates the approved SEO copy, removes WebM in favor of MP4, and fixes responsive product image selection and frame coverage. All 26 desktop/mobile browser tests passed against the public HTTPS domain after deployment. Title, description and H1 were also compared with the release for all four visible SEO pages; noindex remains enabled. Removed WebM files and the hidden New Year page return 404; HTTP and www redirect to the canonical HTTPS domain. Uploaded archive SHA-256: `2251cd1c004dff9db6498a17032c4c915e3e1b30ee9a6b102079e0b4f65ba258`.

The application is a separate Docker Compose project at `/opt/videovitannya`. It uses the existing Traefik proxy and its `letsencrypt-http` certificate resolver. No existing containers, proxy configuration, host port bindings or DNS mail records are replaced.

## Layout

- `compose.yaml` — the configuration in this directory, copied to `/opt/videovitannya/compose.yaml`.
- `deploy.env` — server-local values: `RELEASE`, the pinned `NODE_IMAGE` digest, and `ROUTING_ENABLED`.
- `releases/825202a/` — current prebuilt site, production Node server and its content modules. No runtime npm install is needed.
- `releases/66152d2/` and `deploy.env.before-825202a` — previous application release and deployment settings for rollback.
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

Verify `/`, `/svyatyj-mykolaj/`, `/tsiny/`, `/robots.txt`, `/sitemap.xml` and byte-range responses for both MP4 sizes. All responses currently carry `X-Robots-Tag: noindex, nofollow`; rendered HTML also contains noindex. Sitemap has no URLs, and `/novyj-rik/` returns 404 while Santa is hidden.

For a future release, upload to a new directory, verify the archive checksum, change `RELEASE`, then recreate only this Compose project's web service. Preserve the prior release so rollback only requires selecting the prior `RELEASE` value and running the same `up -d` command. Never run a host-wide Docker cleanup as part of deployment.

Temporary indexing and catalogue controls live in `src/features.mjs`. Changing them requires a new build and deployment. Deployment is manual; GitHub auto-deployment is not configured.
