# Asset attribution

## Human models and motion — Microsoft Rocketbox (MIT)

Source: https://github.com/microsoft/Microsoft-Rocketbox
Pinned commit: 0943055db6ec570bcef9f2c8b41c9e5467c808f9.
Copyright (c) 2020 Microsoft Corporation. Full license ships at public/licenses/Microsoft-Rocketbox.txt.

Male_Adult_07 and Female_Adult_03, with male/female idle_breathe_01, walk_neutral, run_neutral, wave_01, cheer_03 and crouch_in mocap. Exact input files are in scripts/asset-sources.json.

Modified by scripts/build-characters.py: Blender 4.5.9 retargeting to target proportions, in-place animation, original spectacles, 1K packed PBR textures, glTF export. Outputs public/models/hung.glb and public/models/mei.glb. Models are licensed stand-ins, not original likenesses or AI-generated humans.

## Natural surfaces — Poly Haven (CC0)

Powered by Poly Haven. License: https://polyhaven.com/license

- https://polyhaven.com/a/rock_face_03
- https://polyhaven.com/a/forest_ground_04
- https://polyhaven.com/a/sand_01

1K JPG diffuse/normal assets; exact URLs, checksums and sizes in scripts/texture-sources.json. Four files are used by the current scene; the manifest also prepares two ground normal maps for future work. CC0 assets do not imply endorsement.

## Menu artwork — AI-created

Built-in image generation tool, reference-guided generation mode, using the user's supplied illustrated couple only as inspiration for glasses, dark hair and affectionate travel mood. Final deployed asset: public/images/vietnam-hero.jpg (1672 × 941). Working PNG is excluded from deployment. This is a menu illustration, not an in-engine screenshot.

Creative prompt used for the art direction: a photorealistic, warm, natural 16:9 Vietnam coast inspired by Hạ Long and Phú Quốc, lush forested limestone karsts, turquoise water, ivory sand and sunshine; a young adult Vietnamese couple in the right third with dark hair, glasses and casual travel clothing, holding hands; open left space for the landing-page text; no text, UI, logos, watermarks, neon city or copied game assets. Reference drawing supplies mood and accessories, not a facial scan.

## Original procedural work

Hòn Trống Mái mesh profiles, island heightfield, vegetation arrangements, temple/warden geometry, shaders, spectacles, VFX, UI and synthesized audio are created in this project.

Location references (research only; no site photographs copied):
- https://vietnam.travel/places-to-go/northern-vietnam/ha-long
- https://vietnam.travel/places-to-go/southern-vietnam/phu-quoc
- https://halongbay.com.vn/en/p/610-hon-trong-mai-bieu-tuong-doc-dao-cua-vinh-ha-long

It Takes Two and similar cooperative games inform complementary abilities and readable cooperative feedback only. No characters, models, music or levels from those games are used.
