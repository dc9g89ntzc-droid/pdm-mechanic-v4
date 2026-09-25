-- Run this once in the Supabase SQL editor for project ucvsnxexmvxpccyatmmk.
-- Customer name cleanup -- Joanna's legacy import mixed first-name-only and
-- full-name rows, plus case/spelling drift, into a single shared `customers`
-- table (owned by the dealership app, sql/002's own header explains why the
-- mechanic shop reuses it rather than having its own). Every row generated here
-- was matched programmatically against the real exported data -- see the
-- scratchpad dedup_*.py scripts this was generated from, not hand-picked.
--
-- Nothing is ever deleted. A duplicate's job/vehicle history is reassigned to
-- the one surviving (canonical) customer row, then the duplicate is set
-- active = false -- same retire-not-delete convention already used everywhere
-- else in this app (catalogue_items, services, etc). The canonical pick per
-- group prefers a real full name over a bare first name, then correct Title
-- Case (including Mc/Mac/O' surname prefixes) over ALL CAPS/lowercase/stray
-- capitals, then the most recently active row as the final tiebreak.
--
-- Known limitation, not fixed here: two groups picked a still-misspelled
-- survivor because both the correct and misspelled spelling were equally
-- well-cased and there's no reliable way to detect "correct English spelling"
-- programmatically -- 'Noah Lucianio' (should read Luciano) and 'Salvatore
-- Lucianoo' (should read Luciano) are both flagged for a manual rename in
-- catalogue.html-style customer edit after this runs, not silently guessed at.

-- 312 merge groups: reassign each duplicate's owned_vehicles/jobs to
-- the canonical customer row.

-- Karma Karuso <- Karma, karma, Karma Koruso
update owned_vehicles set owner_id = '01137efa-55ec-4644-b0ce-d434bbafc0b0' where owner_id in ('0e3b910b-9fd6-40d1-a8fa-fbf41091780f', '10985cac-44c7-4720-a495-a6c331a0b964', '644f1f5d-7c7c-4b8e-aeb0-1e31f9e3f727');
update jobs set customer_id = '01137efa-55ec-4644-b0ce-d434bbafc0b0' where customer_id in ('0e3b910b-9fd6-40d1-a8fa-fbf41091780f', '10985cac-44c7-4720-a495-a6c331a0b964', '644f1f5d-7c7c-4b8e-aeb0-1e31f9e3f727');

-- Zach <- zach, zACH
update owned_vehicles set owner_id = 'd552a7e1-eba2-437d-a216-de6936e6a451' where owner_id in ('011f04a1-5157-49e3-be5b-1071a0dddf41', '46515c57-1769-4c5d-9f37-303209c5fe04');
update jobs set customer_id = 'd552a7e1-eba2-437d-a216-de6936e6a451' where customer_id in ('011f04a1-5157-49e3-be5b-1071a0dddf41', '46515c57-1769-4c5d-9f37-303209c5fe04');

-- Dylan <- dylan
update owned_vehicles set owner_id = '105fbecb-a2d6-4354-a81a-d3ed6f2aec2a' where owner_id in ('01fc894c-11dd-486f-baea-5fa323c20217');
update jobs set customer_id = '105fbecb-a2d6-4354-a81a-d3ed6f2aec2a' where customer_id in ('01fc894c-11dd-486f-baea-5fa323c20217');

-- Braldey Stoker <- Braldey
update owned_vehicles set owner_id = '020b01d3-e07c-4927-8379-fb13e3fe9793' where owner_id in ('a73327cf-2d9d-4ded-b509-082d8bc312c9');
update jobs set customer_id = '020b01d3-e07c-4927-8379-fb13e3fe9793' where customer_id in ('a73327cf-2d9d-4ded-b509-082d8bc312c9');

-- Inez Rivera <- Inez
update owned_vehicles set owner_id = '1d47582f-3d3d-4116-adb3-60d56a97e231' where owner_id in ('021be4af-b743-4d2f-a6ac-31e73f28e1c2');
update jobs set customer_id = '1d47582f-3d3d-4116-adb3-60d56a97e231' where customer_id in ('021be4af-b743-4d2f-a6ac-31e73f28e1c2');

-- Will King <- wIll king, Will
update owned_vehicles set owner_id = '1dc1b75e-7943-4232-97cf-20481a21c877' where owner_id in ('022b205f-19e7-4d51-a217-2991c07c2b5f', '2723962c-9619-45fc-81ab-51b60ee9b508');
update jobs set customer_id = '1dc1b75e-7943-4232-97cf-20481a21c877' where customer_id in ('022b205f-19e7-4d51-a217-2991c07c2b5f', '2723962c-9619-45fc-81ab-51b60ee9b508');

-- Dakota Burnaman <- Dakota
update owned_vehicles set owner_id = '022b22bf-29a8-473e-9e8f-10d4db6957c2' where owner_id in ('53784da1-b560-405c-acd3-fb6aace15ec1');
update jobs set customer_id = '022b22bf-29a8-473e-9e8f-10d4db6957c2' where customer_id in ('53784da1-b560-405c-acd3-fb6aace15ec1');

-- Rip Wheeler <- rip, Rip
update owned_vehicles set owner_id = '024fdd71-9a57-469d-8d04-93fc4b0cd92e' where owner_id in ('a96da49d-e829-4b25-ad47-14fe6a5e466f', 'd7dfe6ff-0533-4056-94ae-a9752973bb2e');
update jobs set customer_id = '024fdd71-9a57-469d-8d04-93fc4b0cd92e' where customer_id in ('a96da49d-e829-4b25-ad47-14fe6a5e466f', 'd7dfe6ff-0533-4056-94ae-a9752973bb2e');

-- Ivy Rose <- ivy
update owned_vehicles set owner_id = '025fba59-b0f4-4364-b12e-fecf2c8627cb' where owner_id in ('708f3749-e7da-4e5c-8204-567773455bf2');
update jobs set customer_id = '025fba59-b0f4-4364-b12e-fecf2c8627cb' where customer_id in ('708f3749-e7da-4e5c-8204-567773455bf2');

-- Luciel Blackwood <- Luciel
update owned_vehicles set owner_id = '1963f5c5-9a5c-413a-8b57-9d8e1bb89243' where owner_id in ('0289d21a-6966-4507-812c-a05a40bd8515');
update jobs set customer_id = '1963f5c5-9a5c-413a-8b57-9d8e1bb89243' where customer_id in ('0289d21a-6966-4507-812c-a05a40bd8515');

-- Tristan Cabinson <- tristan
update owned_vehicles set owner_id = '02a393ee-3376-4ee2-9784-beb5f940788f' where owner_id in ('e9c90f08-eb64-4058-9db1-6de172641c11');
update jobs set customer_id = '02a393ee-3376-4ee2-9784-beb5f940788f' where customer_id in ('e9c90f08-eb64-4058-9db1-6de172641c11');

-- Rob <- rob
update owned_vehicles set owner_id = '31e3ff10-30db-4740-a0e2-0dc61ff189a0' where owner_id in ('02b31d43-e0e6-4b45-ad9e-ab8d5582b879');
update jobs set customer_id = '31e3ff10-30db-4740-a0e2-0dc61ff189a0' where customer_id in ('02b31d43-e0e6-4b45-ad9e-ab8d5582b879');

-- Brock Hard <- Brock, brock
update owned_vehicles set owner_id = 'b4e150fc-e416-4dbb-84cc-fa9bf8f60213' where owner_id in ('03088fd2-ab65-4325-a27e-5c53f1df6d59', '40ccb085-a767-4f5e-8afb-2d4d612ebf21');
update jobs set customer_id = 'b4e150fc-e416-4dbb-84cc-fa9bf8f60213' where customer_id in ('03088fd2-ab65-4325-a27e-5c53f1df6d59', '40ccb085-a767-4f5e-8afb-2d4d612ebf21');

-- Steve McGarrett <- Steve, Steve McGarret
update owned_vehicles set owner_id = '3790da52-1ffa-4988-99a3-777f649a9f7d' where owner_id in ('04048924-7494-4b41-81e6-122b38801477', 'afdfb836-853b-46c1-8f4f-04906a7dc56f');
update jobs set customer_id = '3790da52-1ffa-4988-99a3-777f649a9f7d' where customer_id in ('04048924-7494-4b41-81e6-122b38801477', 'afdfb836-853b-46c1-8f4f-04906a7dc56f');

-- Jonah <- JOnah
update owned_vehicles set owner_id = '0443175d-c507-4f3e-bb42-c2ec4537c3f1' where owner_id in ('46ab1c05-0396-4e6e-8ccf-c399be9d0a54');
update jobs set customer_id = '0443175d-c507-4f3e-bb42-c2ec4537c3f1' where customer_id in ('46ab1c05-0396-4e6e-8ccf-c399be9d0a54');

-- Maria Costa Lanza <- Maria Cost Lanza
update owned_vehicles set owner_id = '045feee9-fad1-4bb8-9543-73ed90eca90f' where owner_id in ('eb5dc0d3-06f0-40ca-857d-b95f2d02a718');
update jobs set customer_id = '045feee9-fad1-4bb8-9543-73ed90eca90f' where customer_id in ('eb5dc0d3-06f0-40ca-857d-b95f2d02a718');

-- Jacob Hobbs <- Jacob, Jacob, jACOB, jacob, Jacob hobbs, JACOB
update owned_vehicles set owner_id = '3c7c6e02-abc5-4824-b8a8-e3c0ee608fb5' where owner_id in ('04b7a1d4-8c60-4d2f-b092-7bf8888d59bc', '59d4e493-24d2-409e-95af-7a773930646d', '66e04dc1-03b1-4b5c-a27b-427821ebd9ef', 'bf55a7f5-a66b-4506-957d-2b6a3ae04e77', 'd63da249-a1ab-42c0-8ab2-1169d6547026', 'e3827941-695e-45d1-9e50-407f91d6d55a');
update jobs set customer_id = '3c7c6e02-abc5-4824-b8a8-e3c0ee608fb5' where customer_id in ('04b7a1d4-8c60-4d2f-b092-7bf8888d59bc', '59d4e493-24d2-409e-95af-7a773930646d', '66e04dc1-03b1-4b5c-a27b-427821ebd9ef', 'bf55a7f5-a66b-4506-957d-2b6a3ae04e77', 'd63da249-a1ab-42c0-8ab2-1169d6547026', 'e3827941-695e-45d1-9e50-407f91d6d55a');

-- Ebba <- ebba
update owned_vehicles set owner_id = 'ee71e8af-2d66-4386-9c38-d1b7b5785583' where owner_id in ('054428d4-69a6-402e-a84a-f01d00c7a6e4');
update jobs set customer_id = 'ee71e8af-2d66-4386-9c38-d1b7b5785583' where customer_id in ('054428d4-69a6-402e-a84a-f01d00c7a6e4');

-- Rowan Blackwood <- Rowan Balckwood, Rowan
update owned_vehicles set owner_id = 'ca8bc369-5ee9-49aa-bd22-fda2c8fa3b34' where owner_id in ('05457965-113b-4222-9290-33ef59c116ae', '18fb2c1a-6d1d-4c45-8ea0-591d7375f5d0');
update jobs set customer_id = 'ca8bc369-5ee9-49aa-bd22-fda2c8fa3b34' where customer_id in ('05457965-113b-4222-9290-33ef59c116ae', '18fb2c1a-6d1d-4c45-8ea0-591d7375f5d0');

-- Roman <- roman
update owned_vehicles set owner_id = '6f4e3f5f-676e-4dda-a3bf-31dd0dbd38e7' where owner_id in ('0594edfa-753f-4ee0-bce6-a0928a61d265');
update jobs set customer_id = '6f4e3f5f-676e-4dda-a3bf-31dd0dbd38e7' where customer_id in ('0594edfa-753f-4ee0-bce6-a0928a61d265');

-- Michael <- michael
update owned_vehicles set owner_id = '05bb3d79-5d37-41d3-b375-568ed61442dc' where owner_id in ('3a38d3e8-2b1f-4c94-93a2-6e1ec734618a');
update jobs set customer_id = '05bb3d79-5d37-41d3-b375-568ed61442dc' where customer_id in ('3a38d3e8-2b1f-4c94-93a2-6e1ec734618a');

-- JD <- jd
update owned_vehicles set owner_id = '06359efb-0fcd-4644-83b6-d3fb579f780a' where owner_id in ('6f711e7e-cf6a-4fef-b285-c89036a00222');
update jobs set customer_id = '06359efb-0fcd-4644-83b6-d3fb579f780a' where customer_id in ('6f711e7e-cf6a-4fef-b285-c89036a00222');

-- Robert Bluntowski <- Robert
update owned_vehicles set owner_id = '063d32fc-a9f0-4dad-8c35-b045c15758fb' where owner_id in ('5ad7daea-ded1-484b-9da8-9444dfa4545e');
update jobs set customer_id = '063d32fc-a9f0-4dad-8c35-b045c15758fb' where customer_id in ('5ad7daea-ded1-484b-9da8-9444dfa4545e');

-- Kazimir <- kazimir
update owned_vehicles set owner_id = '8d49408f-d9f7-49e5-a847-e6a8c7e002e5' where owner_id in ('06e8964e-32b9-48cd-a38c-d948abf16b19');
update jobs set customer_id = '8d49408f-d9f7-49e5-a847-e6a8c7e002e5' where customer_id in ('06e8964e-32b9-48cd-a38c-d948abf16b19');

-- Bob Millington <- Bob
update owned_vehicles set owner_id = 'ab13842c-b729-4cf0-b8af-bd5c01872144' where owner_id in ('070d8b1a-8a78-4901-aa3c-a9aab1327044');
update jobs set customer_id = 'ab13842c-b729-4cf0-b8af-bd5c01872144' where customer_id in ('070d8b1a-8a78-4901-aa3c-a9aab1327044');

-- Denny Jones <- Denny
update owned_vehicles set owner_id = '07256d57-6e86-4c6f-8d24-06b00c1b5ea9' where owner_id in ('7e0b99fd-1ec1-4bf8-b784-e37f24a6e8b1');
update jobs set customer_id = '07256d57-6e86-4c6f-8d24-06b00c1b5ea9' where customer_id in ('7e0b99fd-1ec1-4bf8-b784-e37f24a6e8b1');

-- Kevin <- kevin, KEVIN
update owned_vehicles set owner_id = '7cf24f3a-0ee3-481c-a31f-5be10ca453eb' where owner_id in ('07d96ad6-1020-448c-8ee1-1157afd620c0', '50f30963-8f00-4ef2-b47e-cd12a5497b1e');
update jobs set customer_id = '7cf24f3a-0ee3-481c-a31f-5be10ca453eb' where customer_id in ('07d96ad6-1020-448c-8ee1-1157afd620c0', '50f30963-8f00-4ef2-b47e-cd12a5497b1e');

-- Nylah Ricci <- Nylah
update owned_vehicles set owner_id = '07e59c2f-8a52-4680-9fa3-188f11adf60c' where owner_id in ('afc849fe-dea5-409f-b0c8-e0a98300ce0b');
update jobs set customer_id = '07e59c2f-8a52-4680-9fa3-188f11adf60c' where customer_id in ('afc849fe-dea5-409f-b0c8-e0a98300ce0b');

-- Beau Bartlett <- Beau
update owned_vehicles set owner_id = '4a1b3ec1-be90-4cbe-baa2-7800013f2090' where owner_id in ('07f65b20-6c98-4458-a181-2adbec8174c4');
update jobs set customer_id = '4a1b3ec1-be90-4cbe-baa2-7800013f2090' where customer_id in ('07f65b20-6c98-4458-a181-2adbec8174c4');

-- Tate Erchip <- Tate, tate
update owned_vehicles set owner_id = '88b4d64d-00d1-4aac-a4fa-d6e6af01c07d' where owner_id in ('082e16e8-be11-4f85-a3ee-60f8fd2ee0ec', 'b543022b-3dd7-46d2-ab7b-74e03a2e745a');
update jobs set customer_id = '88b4d64d-00d1-4aac-a4fa-d6e6af01c07d' where customer_id in ('082e16e8-be11-4f85-a3ee-60f8fd2ee0ec', 'b543022b-3dd7-46d2-ab7b-74e03a2e745a');

-- Dean Voss <- Dean
update owned_vehicles set owner_id = '08ba4386-edb1-4958-9ebe-9b9554ef7e60' where owner_id in ('37cee8d3-88be-4f29-a157-8227180b9c19');
update jobs set customer_id = '08ba4386-edb1-4958-9ebe-9b9554ef7e60' where customer_id in ('37cee8d3-88be-4f29-a157-8227180b9c19');

-- Hazu Zen <- Hazu, hazu
update owned_vehicles set owner_id = '08bc7d86-2643-438e-b819-04260147dc5d' where owner_id in ('6cb5149f-ca3a-4993-84cb-b882b85ef179', '6d353eac-7611-4336-aa27-50bd6afe9256');
update jobs set customer_id = '08bc7d86-2643-438e-b819-04260147dc5d' where customer_id in ('6cb5149f-ca3a-4993-84cb-b882b85ef179', '6d353eac-7611-4336-aa27-50bd6afe9256');

-- Jose Exotic <- Jose
update owned_vehicles set owner_id = '08f84f45-3b30-4881-a98d-0e684f75626f' where owner_id in ('1eea6eeb-4289-456b-b3e2-1aa31afd1e68');
update jobs set customer_id = '08f84f45-3b30-4881-a98d-0e684f75626f' where customer_id in ('1eea6eeb-4289-456b-b3e2-1aa31afd1e68');

-- Jake Panker <- jake
update owned_vehicles set owner_id = 'fc37aa27-4199-4528-ad9a-7d0b75d1adf5' where owner_id in ('0a59ab03-144f-4837-bd76-ff4d12dec321');
update jobs set customer_id = 'fc37aa27-4199-4528-ad9a-7d0b75d1adf5' where customer_id in ('0a59ab03-144f-4837-bd76-ff4d12dec321');

-- Vigo <- vigo
update owned_vehicles set owner_id = '446bcf62-1168-4252-bd50-98db9c8e352a' where owner_id in ('0a5f44cd-dd93-4cb2-8691-36bede0dcf05');
update jobs set customer_id = '446bcf62-1168-4252-bd50-98db9c8e352a' where customer_id in ('0a5f44cd-dd93-4cb2-8691-36bede0dcf05');

-- Marty Berkowitz <- Marty, marty
update owned_vehicles set owner_id = '3539ef43-f4d0-4b46-8224-19e2265416dc' where owner_id in ('0af5589c-a292-42bb-a747-0f4cf313beaf', '5e03a491-cc04-4f12-9b02-5a7ba60933ce');
update jobs set customer_id = '3539ef43-f4d0-4b46-8224-19e2265416dc' where customer_id in ('0af5589c-a292-42bb-a747-0f4cf313beaf', '5e03a491-cc04-4f12-9b02-5a7ba60933ce');

-- Aubrey Reddington <- aubrey, aUBREY
update owned_vehicles set owner_id = '0b414ddc-2f61-49fb-8d80-e1fb71b41baf' where owner_id in ('23c1cfba-c3c1-4fff-b387-45607dbced1a', 'af5d0dd4-2998-49ed-8487-fda7a6515a34');
update jobs set customer_id = '0b414ddc-2f61-49fb-8d80-e1fb71b41baf' where customer_id in ('23c1cfba-c3c1-4fff-b387-45607dbced1a', 'af5d0dd4-2998-49ed-8487-fda7a6515a34');

-- Nick Gates <- Nick GATES
update owned_vehicles set owner_id = '511a4530-046f-44a5-aba5-0fbfcac87dda' where owner_id in ('0bbe9b80-3b58-4ce7-8fea-8f841208915c');
update jobs set customer_id = '511a4530-046f-44a5-aba5-0fbfcac87dda' where customer_id in ('0bbe9b80-3b58-4ce7-8fea-8f841208915c');

-- Cody Garrilpoli <- Cody Garipoli, Cody Garripoli, Cody, cody
update owned_vehicles set owner_id = '79ec8150-8a6f-41a0-a8c7-77161ba59e6b' where owner_id in ('0d3a6154-fcfe-45ce-9e70-0296f5d0129c', '6269bb0f-9993-40d5-8912-13256766225d', '6e8d10d6-3dc7-4fa4-b7bb-73cb8217e6e7', 'f351e2e3-1dad-4e22-bd52-34f24633bc57');
update jobs set customer_id = '79ec8150-8a6f-41a0-a8c7-77161ba59e6b' where customer_id in ('0d3a6154-fcfe-45ce-9e70-0296f5d0129c', '6269bb0f-9993-40d5-8912-13256766225d', '6e8d10d6-3dc7-4fa4-b7bb-73cb8217e6e7', 'f351e2e3-1dad-4e22-bd52-34f24633bc57');

-- Noah Luciano <- Noah Lucianio, NOah, Noah
update owned_vehicles set owner_id = '0d3eb763-af35-406a-a9cf-92d9f8684e54' where owner_id in ('224497fc-f015-4273-979e-d9c897e8dc00', '8bcec4dd-cfb8-4ff4-b1ec-51ecc4ce2ace', 'a4d7dc80-4a9f-47ac-b400-868b009a29f8');
update jobs set customer_id = '0d3eb763-af35-406a-a9cf-92d9f8684e54' where customer_id in ('224497fc-f015-4273-979e-d9c897e8dc00', '8bcec4dd-cfb8-4ff4-b1ec-51ecc4ce2ace', 'a4d7dc80-4a9f-47ac-b400-868b009a29f8');

-- Ethan Tilburg <- Ethan Tillberg, Ethan
update owned_vehicles set owner_id = '39f26912-db36-49e8-9131-91f96abdfde6' where owner_id in ('0d6343cc-6360-4eb2-80df-0d26a3ddaddc', 'e5dbddda-486c-49e9-a527-7a0f80e62996');
update jobs set customer_id = '39f26912-db36-49e8-9131-91f96abdfde6' where customer_id in ('0d6343cc-6360-4eb2-80df-0d26a3ddaddc', 'e5dbddda-486c-49e9-a527-7a0f80e62996');

-- Solar Neralus <- Solar
update owned_vehicles set owner_id = '84ac781f-95a9-4e12-b403-80477e494ecb' where owner_id in ('0d63563a-ad8c-46b7-8e51-1d8bb712ce2c');
update jobs set customer_id = '84ac781f-95a9-4e12-b403-80477e494ecb' where customer_id in ('0d63563a-ad8c-46b7-8e51-1d8bb712ce2c');

-- Jeff <- jeff
update owned_vehicles set owner_id = '0d7618e0-b295-4c1c-b613-fa892e3d43e5' where owner_id in ('704cdfbe-56fd-452d-bb32-60831e338231');
update jobs set customer_id = '0d7618e0-b295-4c1c-b613-fa892e3d43e5' where customer_id in ('704cdfbe-56fd-452d-bb32-60831e338231');

-- Chase <- chase, ChASE
update owned_vehicles set owner_id = '0d80e4f1-2e6f-4f0f-b70a-9bd12960e4e9' where owner_id in ('9e03bc16-42cf-4c77-899f-0686c3a80992', 'e4aa2b4f-7a80-484b-b6d0-c40919767257');
update jobs set customer_id = '0d80e4f1-2e6f-4f0f-b70a-9bd12960e4e9' where customer_id in ('9e03bc16-42cf-4c77-899f-0686c3a80992', 'e4aa2b4f-7a80-484b-b6d0-c40919767257');

-- Santiago Dos Santos <- Santiago
update owned_vehicles set owner_id = 'ad10a92f-12a6-43ce-a713-da59ee809659' where owner_id in ('0d813909-5351-47ea-8513-e941af690115');
update jobs set customer_id = 'ad10a92f-12a6-43ce-a713-da59ee809659' where customer_id in ('0d813909-5351-47ea-8513-e941af690115');

-- Leo <- LEO, leo
update owned_vehicles set owner_id = '0ec0544b-386b-4bd6-a082-5b435905f59c' where owner_id in ('36d18cdf-7e01-4d63-b16b-b033ee8c5030', '786895d5-7d4d-4583-9c63-ee36dfa5a749');
update jobs set customer_id = '0ec0544b-386b-4bd6-a082-5b435905f59c' where customer_id in ('36d18cdf-7e01-4d63-b16b-b033ee8c5030', '786895d5-7d4d-4583-9c63-ee36dfa5a749');

-- Slate Mercer <- Slate
update owned_vehicles set owner_id = '9622a9b6-7671-4c18-9fd9-ebc7a88e6871' where owner_id in ('0efa34f3-b09f-4c3a-9230-8d5376e91205');
update jobs set customer_id = '9622a9b6-7671-4c18-9fd9-ebc7a88e6871' where customer_id in ('0efa34f3-b09f-4c3a-9230-8d5376e91205');

-- Gregor Ecclefechan <- gregor, Gregor
update owned_vehicles set owner_id = '6f4eca52-5d21-4419-b509-94c4edfbd9b7' where owner_id in ('0f728d0d-f264-451b-b64d-75c6c69b976c', '5e41f7fa-cff6-456f-b92a-56eae3fe8e34');
update jobs set customer_id = '6f4eca52-5d21-4419-b509-94c4edfbd9b7' where customer_id in ('0f728d0d-f264-451b-b64d-75c6c69b976c', '5e41f7fa-cff6-456f-b92a-56eae3fe8e34');

-- Dave O'Malley <- Dave, dave, Dave Omalley
update owned_vehicles set owner_id = '10c60213-f6ec-425e-a855-34828c3e9995' where owner_id in ('27cf1923-0197-4ac2-8709-fc573aa79e17', '58ada170-b8e4-4376-8578-7a42268e4875', 'a6ab523d-6176-4841-8e81-df0c68e6ad1d');
update jobs set customer_id = '10c60213-f6ec-425e-a855-34828c3e9995' where customer_id in ('27cf1923-0197-4ac2-8709-fc573aa79e17', '58ada170-b8e4-4376-8578-7a42268e4875', 'a6ab523d-6176-4841-8e81-df0c68e6ad1d');

-- John Conner <- John onner, John COnner
update owned_vehicles set owner_id = '7dd16cf7-506c-44df-a963-3c114b02f421' where owner_id in ('10e647f6-17cd-4ecf-807d-3dedaf34b67a', '1b160ff4-6b9c-4702-bb28-7f3a4aa113c4');
update jobs set customer_id = '7dd16cf7-506c-44df-a963-3c114b02f421' where customer_id in ('10e647f6-17cd-4ecf-807d-3dedaf34b67a', '1b160ff4-6b9c-4702-bb28-7f3a4aa113c4');

-- Skeeter Johnson <- Skeeter
update owned_vehicles set owner_id = '4c4ceb1e-4a16-4376-abd7-8b0c3435137a' where owner_id in ('10eb3f57-e587-461e-ac85-6bf74316374a');
update jobs set customer_id = '4c4ceb1e-4a16-4376-abd7-8b0c3435137a' where customer_id in ('10eb3f57-e587-461e-ac85-6bf74316374a');

-- Angel <- aNGEL
update owned_vehicles set owner_id = 'b4c5ea48-1644-42d7-923a-6a34203c1411' where owner_id in ('117e4ea5-b18c-478c-97cc-5832825e3c8e');
update jobs set customer_id = 'b4c5ea48-1644-42d7-923a-6a34203c1411' where customer_id in ('117e4ea5-b18c-478c-97cc-5832825e3c8e');

-- Cletus McGee <- Cletus Mcgee, cletus, Cletus
update owned_vehicles set owner_id = 'd9d99395-97be-4737-90dd-b39df4fe9b1d' where owner_id in ('11f29ac7-367f-48e1-8694-44b75fe3d729', '47f931fb-3828-42d5-9593-5de7d4f4ac3c', 'ed151eab-3d53-434b-887a-06876f2bcfa6');
update jobs set customer_id = 'd9d99395-97be-4737-90dd-b39df4fe9b1d' where customer_id in ('11f29ac7-367f-48e1-8694-44b75fe3d729', '47f931fb-3828-42d5-9593-5de7d4f4ac3c', 'ed151eab-3d53-434b-887a-06876f2bcfa6');

-- Tom <- tom
update owned_vehicles set owner_id = '8a801bc1-0fd9-40c8-89b1-9b1de751dbe1' where owner_id in ('1225f8d2-7b43-4594-a1d0-f7472f72c83d');
update jobs set customer_id = '8a801bc1-0fd9-40c8-89b1-9b1de751dbe1' where customer_id in ('1225f8d2-7b43-4594-a1d0-f7472f72c83d');

-- Shrey <- shrey
update owned_vehicles set owner_id = '2a44855b-99ba-4881-bb5b-d1c32953a869' where owner_id in ('122c6b5d-3217-4e29-8d88-85c91c73ffc3');
update jobs set customer_id = '2a44855b-99ba-4881-bb5b-d1c32953a869' where customer_id in ('122c6b5d-3217-4e29-8d88-85c91c73ffc3');

-- Holden Marx <- Holden
update owned_vehicles set owner_id = 'd690be4b-64f9-43f4-8fe0-751ec9c9e0dd' where owner_id in ('12724b23-9281-456d-9024-82d3e3c99f97');
update jobs set customer_id = 'd690be4b-64f9-43f4-8fe0-751ec9c9e0dd' where customer_id in ('12724b23-9281-456d-9024-82d3e3c99f97');

-- Carver Martin <- Carver
update owned_vehicles set owner_id = '1283a6f7-ab54-4439-adfd-2aa520276d6a' where owner_id in ('b2da319f-cbd8-438a-bd85-38f6aecea435');
update jobs set customer_id = '1283a6f7-ab54-4439-adfd-2aa520276d6a' where customer_id in ('b2da319f-cbd8-438a-bd85-38f6aecea435');

-- David O'Malley <- david, David omalley, David, David OMalley
update owned_vehicles set owner_id = '43200530-582f-4656-9950-0c837d81e869' where owner_id in ('12d93f27-b80e-4aa0-8d3d-811f449beee3', '8bc008c6-ec13-4a6f-a781-38e440866090', 'a535c1a0-6ec8-4869-ae59-c001bfea0754', 'ddb0e5f7-791a-49c6-8ecf-bc4854218d6c');
update jobs set customer_id = '43200530-582f-4656-9950-0c837d81e869' where customer_id in ('12d93f27-b80e-4aa0-8d3d-811f449beee3', '8bc008c6-ec13-4a6f-a781-38e440866090', 'a535c1a0-6ec8-4869-ae59-c001bfea0754', 'ddb0e5f7-791a-49c6-8ecf-bc4854218d6c');

-- Paul Goodwin <- paul, Paul
update owned_vehicles set owner_id = 'a73e315f-b81e-49ea-ba3f-0d56e1da93fd' where owner_id in ('12e327bb-c375-4ab8-a4ed-6896b002742b', 'b3663a23-bd0f-4fd5-bfea-0b5f53f916c2');
update jobs set customer_id = 'a73e315f-b81e-49ea-ba3f-0d56e1da93fd' where customer_id in ('12e327bb-c375-4ab8-a4ed-6896b002742b', 'b3663a23-bd0f-4fd5-bfea-0b5f53f916c2');

-- Juno <- juno
update owned_vehicles set owner_id = '1352f8eb-2996-4808-8aa8-e9a2d3929616' where owner_id in ('f3eee0d2-6b75-4f80-ae9f-a9390251d47a');
update jobs set customer_id = '1352f8eb-2996-4808-8aa8-e9a2d3929616' where customer_id in ('f3eee0d2-6b75-4f80-ae9f-a9390251d47a');

-- Lexi <- lexi
update owned_vehicles set owner_id = '7139b114-2c58-4ff4-9558-8d5410893f89' where owner_id in ('136cc547-e1d7-4247-b772-3bef99e72fa3');
update jobs set customer_id = '7139b114-2c58-4ff4-9558-8d5410893f89' where customer_id in ('136cc547-e1d7-4247-b772-3bef99e72fa3');

-- Dan <- DAN, dan
update owned_vehicles set owner_id = '2636eb37-421f-4e68-a035-8d83727dd3b7' where owner_id in ('143e1d21-d72d-42f5-853d-3ba4c6477b78', '39323310-0650-4a58-be1d-cbf3355813bc');
update jobs set customer_id = '2636eb37-421f-4e68-a035-8d83727dd3b7' where customer_id in ('143e1d21-d72d-42f5-853d-3ba4c6477b78', '39323310-0650-4a58-be1d-cbf3355813bc');

-- Nik <- nik
update owned_vehicles set owner_id = '1462e1e9-85c9-4155-a05b-0909ffe29ec5' where owner_id in ('9371a38b-3368-4375-9a75-82584c21847c');
update jobs set customer_id = '1462e1e9-85c9-4155-a05b-0909ffe29ec5' where customer_id in ('9371a38b-3368-4375-9a75-82584c21847c');

-- Caitlyn Valen <- Caitlyn
update owned_vehicles set owner_id = '1469b1b3-fee5-40b9-aa2f-6477442fe6f9' where owner_id in ('5b05f801-e8de-4d58-9e6e-3062916edff2');
update jobs set customer_id = '1469b1b3-fee5-40b9-aa2f-6477442fe6f9' where customer_id in ('5b05f801-e8de-4d58-9e6e-3062916edff2');

-- Lucy <- lucy
update owned_vehicles set owner_id = '14f8c1ce-4db4-4afe-ac1a-9651bab139e7' where owner_id in ('aeac97ac-e782-457e-bea9-1f8adbc1b54a');
update jobs set customer_id = '14f8c1ce-4db4-4afe-ac1a-9651bab139e7' where customer_id in ('aeac97ac-e782-457e-bea9-1f8adbc1b54a');

-- Selene Deverraux <- Selene Deveraux, Selene
update owned_vehicles set owner_id = '152c5900-ca87-4853-9826-ddb980d86858' where owner_id in ('1ff78f44-c541-49b0-b871-627cecfae385', '315f1c91-754e-4fb0-a373-5462c8705e6e');
update jobs set customer_id = '152c5900-ca87-4853-9826-ddb980d86858' where customer_id in ('1ff78f44-c541-49b0-b871-627cecfae385', '315f1c91-754e-4fb0-a373-5462c8705e6e');

-- Luicfer Volkov <- Luicfer Vokov
update owned_vehicles set owner_id = '15314e82-ea74-45e8-9dc9-1000e0040efe' where owner_id in ('af780d79-39e8-4d8d-9633-c1730f004150');
update jobs set customer_id = '15314e82-ea74-45e8-9dc9-1000e0040efe' where customer_id in ('af780d79-39e8-4d8d-9633-c1730f004150');

-- Cordelia <- cordelia
update owned_vehicles set owner_id = 'be0ae60c-ea32-4c7a-ae77-7548c4341dc7' where owner_id in ('15331f86-0cdc-4401-8e1a-23287db51e40');
update jobs set customer_id = 'be0ae60c-ea32-4c7a-ae77-7548c4341dc7' where customer_id in ('15331f86-0cdc-4401-8e1a-23287db51e40');

-- Rose Harrington <- Rose, rOSE
update owned_vehicles set owner_id = '9e0eef78-9dca-4055-a6aa-8b1453836088' where owner_id in ('1555d004-2259-4332-bf8a-839f3a1bca36', '980ddf16-aa0d-4c3e-a74f-1d252909324d');
update jobs set customer_id = '9e0eef78-9dca-4055-a6aa-8b1453836088' where customer_id in ('1555d004-2259-4332-bf8a-839f3a1bca36', '980ddf16-aa0d-4c3e-a74f-1d252909324d');

-- Craig Bennington <- Craig, craig
update owned_vehicles set owner_id = '179c4d06-2037-4b98-8813-3737c2c5e65c' where owner_id in ('1589a49a-739d-474f-ac65-7331bb2bf373', '522985b1-9aa4-4dcf-aea8-873e2c6d622f');
update jobs set customer_id = '179c4d06-2037-4b98-8813-3737c2c5e65c' where customer_id in ('1589a49a-739d-474f-ac65-7331bb2bf373', '522985b1-9aa4-4dcf-aea8-873e2c6d622f');

-- Luke Smith <- luke, Luke SMith, Luke
update owned_vehicles set owner_id = '1608707e-93a7-4202-8292-20852fcac3f8' where owner_id in ('40c5480d-d16a-41c0-a7bd-57614c9b67a0', '5907fa3c-5e68-49c3-b74c-b281a2bd111d', 'e4d242f1-1991-4c5b-82f1-263340ed30a2');
update jobs set customer_id = '1608707e-93a7-4202-8292-20852fcac3f8' where customer_id in ('40c5480d-d16a-41c0-a7bd-57614c9b67a0', '5907fa3c-5e68-49c3-b74c-b281a2bd111d', 'e4d242f1-1991-4c5b-82f1-263340ed30a2');

-- Mellon Mangno <- Mellon Mangano, Mellon
update owned_vehicles set owner_id = '16da1b4b-c344-4400-914d-2c04041e20c9' where owner_id in ('b94b8a73-7b62-4339-9fb1-e43e0df32d3b', 'ce95b261-e565-45b8-9d7c-b7f843a1b264');
update jobs set customer_id = '16da1b4b-c344-4400-914d-2c04041e20c9' where customer_id in ('b94b8a73-7b62-4339-9fb1-e43e0df32d3b', 'ce95b261-e565-45b8-9d7c-b7f843a1b264');

-- Jackson <- jackson
update owned_vehicles set owner_id = '16ed5b4b-6db4-4de8-a7dd-d5030c862233' where owner_id in ('fa2b7164-700f-41af-ae20-e5949830bcb9');
update jobs set customer_id = '16ed5b4b-6db4-4de8-a7dd-d5030c862233' where customer_id in ('fa2b7164-700f-41af-ae20-e5949830bcb9');

-- Bill Clean <- Bill
update owned_vehicles set owner_id = '178fb068-dcf2-4aa6-9f27-7736f2bc595a' where owner_id in ('fbf85f49-f60b-42cc-86ae-d09ea35cb78a');
update jobs set customer_id = '178fb068-dcf2-4aa6-9f27-7736f2bc595a' where customer_id in ('fbf85f49-f60b-42cc-86ae-d09ea35cb78a');

-- Norman Norego <- Norman, norman
update owned_vehicles set owner_id = '17b1fba0-e45d-49ea-9ae4-57b7b141142f' where owner_id in ('d449a7f8-31b9-441b-b767-b73faa045683', 'e19df322-7afb-457d-9c07-98c3b01e4d59');
update jobs set customer_id = '17b1fba0-e45d-49ea-9ae4-57b7b141142f' where customer_id in ('d449a7f8-31b9-441b-b767-b73faa045683', 'e19df322-7afb-457d-9c07-98c3b01e4d59');

-- Max Stone <- MAX, Max tone, Max STONE, Max
update owned_vehicles set owner_id = '8f5d71bf-541a-461b-a6fc-28b125ebb02c' where owner_id in ('1823ea4b-5ec7-4b92-8398-2eb32a626b63', '2f690393-7f3d-4ab5-adc8-5aad9b645ff6', 'a6c38ad2-6431-4618-8ed0-faec33c2b817', 'cb3e4fa8-3dd6-49a6-a5e7-c4e8bcac3263');
update jobs set customer_id = '8f5d71bf-541a-461b-a6fc-28b125ebb02c' where customer_id in ('1823ea4b-5ec7-4b92-8398-2eb32a626b63', '2f690393-7f3d-4ab5-adc8-5aad9b645ff6', 'a6c38ad2-6431-4618-8ed0-faec33c2b817', 'cb3e4fa8-3dd6-49a6-a5e7-c4e8bcac3263');

-- Gerald Grey <- Gerald
update owned_vehicles set owner_id = '4e5eec98-d4cd-40f5-8bc2-55ff43a441b6' where owner_id in ('18987d23-665b-4304-bbac-77ded3ef23e2');
update jobs set customer_id = '4e5eec98-d4cd-40f5-8bc2-55ff43a441b6' where customer_id in ('18987d23-665b-4304-bbac-77ded3ef23e2');

-- Liam Tray <- Liam Tray, Liam
update owned_vehicles set owner_id = '18b41f41-083d-4df9-9f18-f8586aebe23d' where owner_id in ('55f4a44e-28e8-474e-b925-c489862ccef8', '98ca738e-4f4a-4a6b-83e5-4e2a9fed59c9');
update jobs set customer_id = '18b41f41-083d-4df9-9f18-f8586aebe23d' where customer_id in ('55f4a44e-28e8-474e-b925-c489862ccef8', '98ca738e-4f4a-4a6b-83e5-4e2a9fed59c9');

-- X <- x
update owned_vehicles set owner_id = '1924f09b-40cd-4719-a86c-33875a0b7042' where owner_id in ('a95ae374-ad72-4845-a010-544910cf5cb3');
update jobs set customer_id = '1924f09b-40cd-4719-a86c-33875a0b7042' where customer_id in ('a95ae374-ad72-4845-a010-544910cf5cb3');

-- Adrian Ramon <- Adrian
update owned_vehicles set owner_id = '19994195-a999-4568-be7d-37dd1d84f8b2' where owner_id in ('6e6ece0a-9d64-4dad-ba5b-915cf7935d71');
update jobs set customer_id = '19994195-a999-4568-be7d-37dd1d84f8b2' where customer_id in ('6e6ece0a-9d64-4dad-ba5b-915cf7935d71');

-- Nick Ricci <- Nick Ricki
update owned_vehicles set owner_id = '19aacd2e-cddb-422c-b2a7-cfdf21320c7a' where owner_id in ('468a1092-282a-40d4-a345-cdcf6dad1e34');
update jobs set customer_id = '19aacd2e-cddb-422c-b2a7-cfdf21320c7a' where customer_id in ('468a1092-282a-40d4-a345-cdcf6dad1e34');

-- Jonny <- jonny
update owned_vehicles set owner_id = '61ad6689-2f63-4877-8d5c-eab54d682e9c' where owner_id in ('19abe388-dfac-4330-99f2-eafc0042c53e');
update jobs set customer_id = '61ad6689-2f63-4877-8d5c-eab54d682e9c' where customer_id in ('19abe388-dfac-4330-99f2-eafc0042c53e');

-- Bobbo La Blue <- Bobbo, Bobbo LaBlue
update owned_vehicles set owner_id = '19dddf73-412e-435a-8e3d-125e9a4b2831' where owner_id in ('35661c6b-afa9-411c-b7fd-96b4fe101c7d', 'a6c820ae-e9ff-43dd-b085-9a59c4b57e58');
update jobs set customer_id = '19dddf73-412e-435a-8e3d-125e9a4b2831' where customer_id in ('35661c6b-afa9-411c-b7fd-96b4fe101c7d', 'a6c820ae-e9ff-43dd-b085-9a59c4b57e58');

-- Astro Reeves <- Astro
update owned_vehicles set owner_id = '4cc8085c-77d3-4a5b-a089-868815062f40' where owner_id in ('19e8a658-4e9e-4fcf-b12a-e79faf756cb1');
update jobs set customer_id = '4cc8085c-77d3-4a5b-a089-868815062f40' where customer_id in ('19e8a658-4e9e-4fcf-b12a-e79faf756cb1');

-- Contra <- contra
update owned_vehicles set owner_id = '86e6ffa6-67e5-466c-b515-0633f3c2dea0' where owner_id in ('1aea4a13-6e4b-4354-ab5f-dde124c9afe4');
update jobs set customer_id = '86e6ffa6-67e5-466c-b515-0633f3c2dea0' where customer_id in ('1aea4a13-6e4b-4354-ab5f-dde124c9afe4');

-- Reese Hat <- reese, Reese
update owned_vehicles set owner_id = '899279f0-23b9-4734-9881-49b4fdd34086' where owner_id in ('1af7f3dc-055c-4326-a2ee-0d0992032957', '580316bb-5417-42e9-8d57-ab3bf6e0c9e8');
update jobs set customer_id = '899279f0-23b9-4734-9881-49b4fdd34086' where customer_id in ('1af7f3dc-055c-4326-a2ee-0d0992032957', '580316bb-5417-42e9-8d57-ab3bf6e0c9e8');

-- Terry Ginger <- terry, Terry
update owned_vehicles set owner_id = '874fbf62-6d71-4530-bb54-58c9daa0bc3d' where owner_id in ('1afc33f4-0d13-4fd2-8150-7e1bb56b5ea8', '3d81afbf-bd8a-4f48-9ce1-9beed020c92d');
update jobs set customer_id = '874fbf62-6d71-4530-bb54-58c9daa0bc3d' where customer_id in ('1afc33f4-0d13-4fd2-8150-7e1bb56b5ea8', '3d81afbf-bd8a-4f48-9ce1-9beed020c92d');

-- Lil Peeps <- Lil PEEPS, Lil peeps, lil peeeps, lil peeps
update owned_vehicles set owner_id = '2dd7b60d-9e36-413b-af36-b6ee4fb035d2' where owner_id in ('1b38d274-6daa-4d63-850a-407433ce9dde', '56ad842c-c92e-42ab-9b74-e54016e0dcb1', 'd2eb823a-e538-49ba-be18-6b2f452f927a', 'edd40dfb-3798-4ee9-a703-b3cca758b9a6');
update jobs set customer_id = '2dd7b60d-9e36-413b-af36-b6ee4fb035d2' where customer_id in ('1b38d274-6daa-4d63-850a-407433ce9dde', '56ad842c-c92e-42ab-9b74-e54016e0dcb1', 'd2eb823a-e538-49ba-be18-6b2f452f927a', 'edd40dfb-3798-4ee9-a703-b3cca758b9a6');

-- Jay Zelaas <- Jay Zelllas, Jay, jay, Jay Zellas
update owned_vehicles set owner_id = '832c4783-7523-46b4-9c2a-233fecfb70fd' where owner_id in ('1b4851b2-3a6c-4943-a9d6-5a98bb40dffe', '1cd94951-0c77-4d3c-8c38-58df50fc3ba1', '20295a22-b213-4851-ad04-59af2b3b009c', '96754762-2ec6-42eb-830e-90dff84d2a7e');
update jobs set customer_id = '832c4783-7523-46b4-9c2a-233fecfb70fd' where customer_id in ('1b4851b2-3a6c-4943-a9d6-5a98bb40dffe', '1cd94951-0c77-4d3c-8c38-58df50fc3ba1', '20295a22-b213-4851-ad04-59af2b3b009c', '96754762-2ec6-42eb-830e-90dff84d2a7e');

-- Rex Terr <- Rex, rex
update owned_vehicles set owner_id = '4867e928-d078-42ab-a77d-ee3dbfc514a0' where owner_id in ('1be1ac85-91eb-42bb-ab92-8dfbaefaf966', '9ea9549d-75d8-4b1d-92fd-a45776c3dc6a');
update jobs set customer_id = '4867e928-d078-42ab-a77d-ee3dbfc514a0' where customer_id in ('1be1ac85-91eb-42bb-ab92-8dfbaefaf966', '9ea9549d-75d8-4b1d-92fd-a45776c3dc6a');

-- Joe <- joe
update owned_vehicles set owner_id = 'aa782ff5-27cf-47ca-9d44-8bc330befdd9' where owner_id in ('1beb0351-f549-4046-9edf-cf9630368ad0');
update jobs set customer_id = 'aa782ff5-27cf-47ca-9d44-8bc330befdd9' where customer_id in ('1beb0351-f549-4046-9edf-cf9630368ad0');

-- Ted Smitty <- Ted SMitty, Ted, Ted SMITTY
update owned_vehicles set owner_id = '1bf88178-4c82-4078-891b-0f6538b81bb0' where owner_id in ('35a2ed49-78cf-4398-ade1-281de2d90a82', '4ec3936b-e986-4d76-8fa3-131b9d286bcc', 'f4852ef8-2575-48a8-9cc8-ee070d58c6ba');
update jobs set customer_id = '1bf88178-4c82-4078-891b-0f6538b81bb0' where customer_id in ('35a2ed49-78cf-4398-ade1-281de2d90a82', '4ec3936b-e986-4d76-8fa3-131b9d286bcc', 'f4852ef8-2575-48a8-9cc8-ee070d58c6ba');

-- Ronnie <- ronnie
update owned_vehicles set owner_id = '834f8c78-9568-4d82-9a25-5204987e831c' where owner_id in ('1c83fa81-e3d4-4145-bc8d-181a3ddbc865');
update jobs set customer_id = '834f8c78-9568-4d82-9a25-5204987e831c' where customer_id in ('1c83fa81-e3d4-4145-bc8d-181a3ddbc865');

-- Ghost Sale <- Ghost Ass Sale, Ghost
update owned_vehicles set owner_id = '1cbe487c-4d35-409d-a772-b7069887f173' where owner_id in ('5573bf04-989d-4a11-94f4-84fb353abe53', '73ed4bac-61f8-4f54-ba5e-66e2cdb9d701');
update jobs set customer_id = '1cbe487c-4d35-409d-a772-b7069887f173' where customer_id in ('5573bf04-989d-4a11-94f4-84fb353abe53', '73ed4bac-61f8-4f54-ba5e-66e2cdb9d701');

-- Kenny Montana <- Kenny
update owned_vehicles set owner_id = '1d89fe75-4940-4b4c-89b4-6aa7c76c88a3' where owner_id in ('eece3a3e-81ce-463b-ba82-f22d8b8e0da6');
update jobs set customer_id = '1d89fe75-4940-4b4c-89b4-6aa7c76c88a3' where customer_id in ('eece3a3e-81ce-463b-ba82-f22d8b8e0da6');

-- Kyle <- kyle
update owned_vehicles set owner_id = '1e105b9a-8ad8-4933-8083-0b6790846cf2' where owner_id in ('bdb428e7-a58a-4d4f-9c56-0bd8b7d77bce');
update jobs set customer_id = '1e105b9a-8ad8-4933-8083-0b6790846cf2' where customer_id in ('bdb428e7-a58a-4d4f-9c56-0bd8b7d77bce');

-- Fabio Rendino <- Fabio
update owned_vehicles set owner_id = '1e4e7ad0-856e-4d84-b38f-62afb72f51a6' where owner_id in ('9e04c9b8-79ae-4691-be4d-2630d82caf13');
update jobs set customer_id = '1e4e7ad0-856e-4d84-b38f-62afb72f51a6' where customer_id in ('9e04c9b8-79ae-4691-be4d-2630d82caf13');

-- Domenick Grayson <- Domenick
update owned_vehicles set owner_id = '1f6d6308-051a-4c11-8610-4024d0577424' where owner_id in ('7ec46890-1215-481b-8284-d6d2e77702b6');
update jobs set customer_id = '1f6d6308-051a-4c11-8610-4024d0577424' where customer_id in ('7ec46890-1215-481b-8284-d6d2e77702b6');

-- Aria Luna <- Aria, ARIA
update owned_vehicles set owner_id = 'f8716db4-fc86-4e47-862e-12b7d762b54d' where owner_id in ('1fbe7b42-e502-4882-a1d9-836e5c75189c', 'ceac5dd6-6e29-4873-aa11-2e6bed8caf1f');
update jobs set customer_id = 'f8716db4-fc86-4e47-862e-12b7d762b54d' where customer_id in ('1fbe7b42-e502-4882-a1d9-836e5c75189c', 'ceac5dd6-6e29-4873-aa11-2e6bed8caf1f');

-- Wes <- wes
update owned_vehicles set owner_id = '6e0bdf0c-8b77-4c09-af31-0e1fd71df471' where owner_id in ('201bd3c1-3ca0-4b0c-bf4f-8c177d6c9639');
update jobs set customer_id = '6e0bdf0c-8b77-4c09-af31-0e1fd71df471' where customer_id in ('201bd3c1-3ca0-4b0c-bf4f-8c177d6c9639');

-- Fred Sandford <- Fred Sanford, Fred, Fred Sanfoird
update owned_vehicles set owner_id = 'f946a608-b1ec-446e-9d6d-14de2a9345e0' where owner_id in ('2106218b-1aad-493b-bfb3-ed29f5f388aa', 'ae513226-37c8-4e20-9daa-96270662be76', 'f0dbc474-65f5-47c6-be78-f274ad42f967');
update jobs set customer_id = 'f946a608-b1ec-446e-9d6d-14de2a9345e0' where customer_id in ('2106218b-1aad-493b-bfb3-ed29f5f388aa', 'ae513226-37c8-4e20-9daa-96270662be76', 'f0dbc474-65f5-47c6-be78-f274ad42f967');

-- Vincent <- vincent
update owned_vehicles set owner_id = 'cfe9e218-7199-4d52-a130-f8087d51f3d7' where owner_id in ('2154ec78-d053-424c-a592-3dcba6cb402c');
update jobs set customer_id = 'cfe9e218-7199-4d52-a130-f8087d51f3d7' where customer_id in ('2154ec78-d053-424c-a592-3dcba6cb402c');

-- Eddie Taylor <- EDDIE, Eddie, eddie
update owned_vehicles set owner_id = '3ac42a6b-8acd-4e39-af52-59397cfc57e8' where owner_id in ('2191b408-ab19-4dac-93b6-23d389a8a7ef', '2e87cfee-845a-44db-80a1-c86b2aff1c71', 'f98c3743-8019-48a7-a123-30d9813d341c');
update jobs set customer_id = '3ac42a6b-8acd-4e39-af52-59397cfc57e8' where customer_id in ('2191b408-ab19-4dac-93b6-23d389a8a7ef', '2e87cfee-845a-44db-80a1-c86b2aff1c71', 'f98c3743-8019-48a7-a123-30d9813d341c');

-- Nick <- nick
update owned_vehicles set owner_id = '21a5586f-4c90-48ca-8c55-b39f65011962' where owner_id in ('22bf75de-c364-4c17-9d33-b1915c7d2f37');
update jobs set customer_id = '21a5586f-4c90-48ca-8c55-b39f65011962' where customer_id in ('22bf75de-c364-4c17-9d33-b1915c7d2f37');

-- Scarlett Phoenix <- Scarlett
update owned_vehicles set owner_id = '21aac44d-b1f5-40d7-99d7-d02dda2b6edb' where owner_id in ('c8a47bce-1f23-42a2-ad3d-2c6b33b26358');
update jobs set customer_id = '21aac44d-b1f5-40d7-99d7-d02dda2b6edb' where customer_id in ('c8a47bce-1f23-42a2-ad3d-2c6b33b26358');

-- Judith Solace <- Judith
update owned_vehicles set owner_id = '768ce90e-a3b0-4b16-aff9-4ee818695577' where owner_id in ('21b2e6dd-4e3e-43d9-b191-c929ecc6adec');
update jobs set customer_id = '768ce90e-a3b0-4b16-aff9-4ee818695577' where customer_id in ('21b2e6dd-4e3e-43d9-b191-c929ecc6adec');

-- Nicky Hughes <- Nicky Huges, Nicky HUGHES, Nicky
update owned_vehicles set owner_id = '21cef048-0134-477a-88df-bc460669d6cb' where owner_id in ('7a37b13a-5204-4fee-8198-0caaa9aa8fe9', 'efa5cdb2-9580-42b2-9881-2b4adfab293c', 'f401e2be-7b71-40ce-b329-430a6bba49c4');
update jobs set customer_id = '21cef048-0134-477a-88df-bc460669d6cb' where customer_id in ('7a37b13a-5204-4fee-8198-0caaa9aa8fe9', 'efa5cdb2-9580-42b2-9881-2b4adfab293c', 'f401e2be-7b71-40ce-b329-430a6bba49c4');

-- Frank Glass <- Frank GLASS, Frank
update owned_vehicles set owner_id = '232263ba-f71d-4efd-b935-30c61a4d3d71' where owner_id in ('3606ae60-ab2a-4ff8-81d7-e7a2aa8aeccb', 'a9a6f041-e796-49ba-bb68-bb558dbe75d7');
update jobs set customer_id = '232263ba-f71d-4efd-b935-30c61a4d3d71' where customer_id in ('3606ae60-ab2a-4ff8-81d7-e7a2aa8aeccb', 'a9a6f041-e796-49ba-bb68-bb558dbe75d7');

-- Enrique Marquez <- Enrique, enrique
update owned_vehicles set owner_id = '2429cf17-ae60-4f83-b3a1-62f3b93883cb' where owner_id in ('6047b842-ee3b-42da-8911-738cf4ae0c0d', 'ea03f978-f416-4ec6-8be1-36cc732aebc1');
update jobs set customer_id = '2429cf17-ae60-4f83-b3a1-62f3b93883cb' where customer_id in ('6047b842-ee3b-42da-8911-738cf4ae0c0d', 'ea03f978-f416-4ec6-8be1-36cc732aebc1');

-- Oliver <- oliver
update owned_vehicles set owner_id = '6b4fac63-7ff6-4360-a8a5-9c94cc0d50db' where owner_id in ('2486d26a-a910-4e55-997e-c9bc647013c2');
update jobs set customer_id = '6b4fac63-7ff6-4360-a8a5-9c94cc0d50db' where customer_id in ('2486d26a-a910-4e55-997e-c9bc647013c2');

-- Vladimir Dragunov <- Vladimir
update owned_vehicles set owner_id = '24faa702-062d-465a-a8aa-d5c8a49f8079' where owner_id in ('bbd63853-f847-4b4f-b5db-5d7ec0cf15e7');
update jobs set customer_id = '24faa702-062d-465a-a8aa-d5c8a49f8079' where customer_id in ('bbd63853-f847-4b4f-b5db-5d7ec0cf15e7');

-- Tiff Chanel <- tiff, Tiff
update owned_vehicles set owner_id = '257846af-f682-4082-a3d5-476593529a27' where owner_id in ('49d44934-151a-452c-ac7a-3b302ad985f6', 'f540354c-35e7-416e-825b-82ab09bff00a');
update jobs set customer_id = '257846af-f682-4082-a3d5-476593529a27' where customer_id in ('49d44934-151a-452c-ac7a-3b302ad985f6', 'f540354c-35e7-416e-825b-82ab09bff00a');

-- Legend Moretti <- Legend MORETTI, Legend
update owned_vehicles set owner_id = '25b49c48-5fea-42f1-912a-2fd77c669d2d' where owner_id in ('7af40590-8a2d-4f47-ab6d-0847614be29f', '95965b6b-50ff-433f-aba6-22db48963391');
update jobs set customer_id = '25b49c48-5fea-42f1-912a-2fd77c669d2d' where customer_id in ('7af40590-8a2d-4f47-ab6d-0847614be29f', '95965b6b-50ff-433f-aba6-22db48963391');

-- Robin Banks <- Robin
update owned_vehicles set owner_id = '25c5a52d-262d-47c6-a8d7-c16a648377f4' where owner_id in ('7f6134b5-daeb-4917-83fb-b5e7fd0de5e8');
update jobs set customer_id = '25c5a52d-262d-47c6-a8d7-c16a648377f4' where customer_id in ('7f6134b5-daeb-4917-83fb-b5e7fd0de5e8');

-- Cal McKenna <- Cal, Cal Mckenna
update owned_vehicles set owner_id = '2dfd3428-08bd-424c-b505-70e7f62a5a2c' where owner_id in ('262d36ae-d939-4567-82ec-5334482b4b15', 'd4172afc-1c9d-41d5-a5ae-1c8560c444d4');
update jobs set customer_id = '2dfd3428-08bd-424c-b505-70e7f62a5a2c' where customer_id in ('262d36ae-d939-4567-82ec-5334482b4b15', 'd4172afc-1c9d-41d5-a5ae-1c8560c444d4');

-- Arthur Cross <- Arthur
update owned_vehicles set owner_id = '2664b25c-01a9-4d7b-8c0a-8acb34924269' where owner_id in ('4cc4b0bd-c712-46ad-a5f6-39aea0c6db12');
update jobs set customer_id = '2664b25c-01a9-4d7b-8c0a-8acb34924269' where customer_id in ('4cc4b0bd-c712-46ad-a5f6-39aea0c6db12');

-- Nox O'Connor <- nox, Nox
update owned_vehicles set owner_id = '76049eb2-7257-4e2b-9686-261b09788642' where owner_id in ('267a5bfb-152f-4c8d-a761-86f78fe1989c', '51884d73-c497-495d-9932-4c03d2f4b193');
update jobs set customer_id = '76049eb2-7257-4e2b-9686-261b09788642' where customer_id in ('267a5bfb-152f-4c8d-a761-86f78fe1989c', '51884d73-c497-495d-9932-4c03d2f4b193');

-- Smittie Jenkins <- Smittie, smittie
update owned_vehicles set owner_id = 'eb3713b8-a0ee-4fdd-b4e2-f1db14b34591' where owner_id in ('26a7b3af-de74-4dbb-accc-bef4e987bdb3', 'c0bef179-09d3-4cf0-a85c-6e09465f1e4c');
update jobs set customer_id = 'eb3713b8-a0ee-4fdd-b4e2-f1db14b34591' where customer_id in ('26a7b3af-de74-4dbb-accc-bef4e987bdb3', 'c0bef179-09d3-4cf0-a85c-6e09465f1e4c');

-- J Grinz <- J, J GRrinz
update owned_vehicles set owner_id = '270db6e9-31ad-4947-842f-2928575969a5' where owner_id in ('3c62dde3-bf28-4b33-80aa-95b0dd9e34e2', '57369a09-8a1f-4999-ae13-67ca57cc8803');
update jobs set customer_id = '270db6e9-31ad-4947-842f-2928575969a5' where customer_id in ('3c62dde3-bf28-4b33-80aa-95b0dd9e34e2', '57369a09-8a1f-4999-ae13-67ca57cc8803');

-- Jin Liu <- Jin
update owned_vehicles set owner_id = '272c4ad0-3fd7-46bd-86a3-507d0309ecf9' where owner_id in ('5e96b27b-4ff3-412a-88f8-7bd27bffc3c6');
update jobs set customer_id = '272c4ad0-3fd7-46bd-86a3-507d0309ecf9' where customer_id in ('5e96b27b-4ff3-412a-88f8-7bd27bffc3c6');

-- Lucas <- lucas
update owned_vehicles set owner_id = 'e68410af-552a-42a5-b1b0-b1549a68dbbc' where owner_id in ('2941a3f5-26d2-4a08-9785-b890b7b07cb8');
update jobs set customer_id = 'e68410af-552a-42a5-b1b0-b1549a68dbbc' where customer_id in ('2941a3f5-26d2-4a08-9785-b890b7b07cb8');

-- Ash Burger <- Ash Burrger, ash, Ash
update owned_vehicles set owner_id = '29ed48bc-606e-42f6-93f8-bee9154b4c07' where owner_id in ('763b1143-1480-44be-9c55-5d55ddee5b87', 'aec189cc-f831-4751-b465-f79560683f50', 'b9f11042-5bd3-4fee-8abc-4df863509b02');
update jobs set customer_id = '29ed48bc-606e-42f6-93f8-bee9154b4c07' where customer_id in ('763b1143-1480-44be-9c55-5d55ddee5b87', 'aec189cc-f831-4751-b465-f79560683f50', 'b9f11042-5bd3-4fee-8abc-4df863509b02');

-- Geo Rodgers <- Geo
update owned_vehicles set owner_id = '29f84d2d-5e1f-4be6-b3bc-225a9862a666' where owner_id in ('fac03631-eea2-4d5c-890c-c85d152faabe');
update jobs set customer_id = '29f84d2d-5e1f-4be6-b3bc-225a9862a666' where customer_id in ('fac03631-eea2-4d5c-890c-c85d152faabe');

-- Walter Heisenberg <- Walter, Walter Heisenburg
update owned_vehicles set owner_id = 'fcd21e18-db7f-4c4d-969d-d62ac8006da4' where owner_id in ('2a1db84e-c39f-48bb-a564-990fa8f60c6a', '39a56297-0cf2-4434-9c8b-681ae5ed237a');
update jobs set customer_id = 'fcd21e18-db7f-4c4d-969d-d62ac8006da4' where customer_id in ('2a1db84e-c39f-48bb-a564-990fa8f60c6a', '39a56297-0cf2-4434-9c8b-681ae5ed237a');

-- Manuel Oliveira <- Manuel Oliviera, Manuel Oliveria, Manuel, Manuel Olvieria
update owned_vehicles set owner_id = '2a33ba6e-5a0d-4354-9e56-02bcc0ac9cf7' where owner_id in ('3aca4053-77a1-4f10-b4a4-23c2059a8bef', '4c22865a-d746-4dd9-9a49-26b694245511', '7026d16a-9501-40b6-9d56-9c54cd7755c8', 'cda03aa9-dd53-40c0-982e-3edfce843154');
update jobs set customer_id = '2a33ba6e-5a0d-4354-9e56-02bcc0ac9cf7' where customer_id in ('3aca4053-77a1-4f10-b4a4-23c2059a8bef', '4c22865a-d746-4dd9-9a49-26b694245511', '7026d16a-9501-40b6-9d56-9c54cd7755c8', 'cda03aa9-dd53-40c0-982e-3edfce843154');

-- Dixon Herise <- Dixon
update owned_vehicles set owner_id = 'c4ad3a11-cff6-4542-a024-ae86b7f39510' where owner_id in ('2a69f276-989b-4487-8cda-d41d5176a59d');
update jobs set customer_id = 'c4ad3a11-cff6-4542-a024-ae86b7f39510' where customer_id in ('2a69f276-989b-4487-8cda-d41d5176a59d');

-- Jay Gomezx <- Jay Gomez
update owned_vehicles set owner_id = '2bda8ca1-f88f-450b-8703-a5fc7cdf227b' where owner_id in ('541e23e9-3d0a-4972-9e34-4a04223cb9ae');
update jobs set customer_id = '2bda8ca1-f88f-450b-8703-a5fc7cdf227b' where customer_id in ('541e23e9-3d0a-4972-9e34-4a04223cb9ae');

-- Tris Owl <- Tris
update owned_vehicles set owner_id = '838155d0-c147-483f-8ed2-4679bebb5027' where owner_id in ('2c5648f1-d4bc-4157-87a6-abdbfc8ec8da');
update jobs set customer_id = '838155d0-c147-483f-8ed2-4679bebb5027' where customer_id in ('2c5648f1-d4bc-4157-87a6-abdbfc8ec8da');

-- Seth Connor <- Seth, Seth Connnor, Seth Conner
update owned_vehicles set owner_id = '9122128e-81c0-4fc1-8236-36ddf02917f1' where owner_id in ('2db59ef1-671c-4866-8426-69b1f26ac096', 'ab9298ed-580a-4c89-8005-f96106a5fe04', 'fc5bd23e-5ba7-4524-a960-29125845f080');
update jobs set customer_id = '9122128e-81c0-4fc1-8236-36ddf02917f1' where customer_id in ('2db59ef1-671c-4866-8426-69b1f26ac096', 'ab9298ed-580a-4c89-8005-f96106a5fe04', 'fc5bd23e-5ba7-4524-a960-29125845f080');

-- Charles Almond <- Charles amlond, CHARLES ALMOND, Charles, Charles ALMOND, Charles Almonmd
update owned_vehicles set owner_id = 'e1daa481-c8a3-4530-ac86-b6ad66d0a63c' where owner_id in ('2de2018d-ca06-48c7-be2d-40a0c90564c4', '3a2b81e7-282b-4467-9b9c-10c96ab122a1', '80600097-79e3-4869-9f50-e3860eed5d8d', 'cf2111f4-7ee4-4117-985c-97b9ac241b3e', 'd9bb01bd-0aa9-4bc6-af43-6a4c9287ed10');
update jobs set customer_id = 'e1daa481-c8a3-4530-ac86-b6ad66d0a63c' where customer_id in ('2de2018d-ca06-48c7-be2d-40a0c90564c4', '3a2b81e7-282b-4467-9b9c-10c96ab122a1', '80600097-79e3-4869-9f50-e3860eed5d8d', 'cf2111f4-7ee4-4117-985c-97b9ac241b3e', 'd9bb01bd-0aa9-4bc6-af43-6a4c9287ed10');

-- Mick Mayfair <- Mick
update owned_vehicles set owner_id = '2e08fd71-6bb7-4beb-b35b-84590eff7167' where owner_id in ('3371d83e-3737-4ceb-8c8c-4679ec013be3');
update jobs set customer_id = '2e08fd71-6bb7-4beb-b35b-84590eff7167' where customer_id in ('3371d83e-3737-4ceb-8c8c-4679ec013be3');

-- Chloe Bakert <- Chloe, Chloe Baker
update owned_vehicles set owner_id = '59e7929e-2b9f-4241-9ee7-9c31b1b916d4' where owner_id in ('2e472f3e-85ee-4ad9-a7d7-1c3c4fd20d06', 'd1886be6-8697-4364-94d5-9feac9dfcf42');
update jobs set customer_id = '59e7929e-2b9f-4241-9ee7-9c31b1b916d4' where customer_id in ('2e472f3e-85ee-4ad9-a7d7-1c3c4fd20d06', 'd1886be6-8697-4364-94d5-9feac9dfcf42');

-- Vlad <- vlad
update owned_vehicles set owner_id = 'e9956a2b-7180-4223-8ff4-8e9b9a59a61d' where owner_id in ('30abaf5d-aea9-4c3b-89ff-7dcb00d446a8');
update jobs set customer_id = 'e9956a2b-7180-4223-8ff4-8e9b9a59a61d' where customer_id in ('30abaf5d-aea9-4c3b-89ff-7dcb00d446a8');

-- Andy Stevens <- andy
update owned_vehicles set owner_id = '30acacf6-0100-43fc-92f6-e1f07379ac32' where owner_id in ('fd449086-a848-4a26-9227-04c46368e10b');
update jobs set customer_id = '30acacf6-0100-43fc-92f6-e1f07379ac32' where customer_id in ('fd449086-a848-4a26-9227-04c46368e10b');

-- Barry <- barry
update owned_vehicles set owner_id = '4769d884-7764-47ac-96bf-ba8d4c6526bc' where owner_id in ('30b7ee92-9846-441d-9fec-262a1d005c1f');
update jobs set customer_id = '4769d884-7764-47ac-96bf-ba8d4c6526bc' where customer_id in ('30b7ee92-9846-441d-9fec-262a1d005c1f');

-- Jerry Hill <- Jerry
update owned_vehicles set owner_id = '30cf6bc1-248d-4806-8817-723d2034582e' where owner_id in ('4c904474-ecab-4716-8670-93ed9d35a767');
update jobs set customer_id = '30cf6bc1-248d-4806-8817-723d2034582e' where customer_id in ('4c904474-ecab-4716-8670-93ed9d35a767');

-- Camilla Saunders <- Camilla
update owned_vehicles set owner_id = 'e499dda0-7496-4540-aefc-87958ebf94c4' where owner_id in ('30f59528-263d-4263-b165-36b44a61d4e1');
update jobs set customer_id = 'e499dda0-7496-4540-aefc-87958ebf94c4' where customer_id in ('30f59528-263d-4263-b165-36b44a61d4e1');

-- Roland Miller <- Roland
update owned_vehicles set owner_id = '310a28dd-0452-49f3-b5d8-8c1905595e1e' where owner_id in ('5313831d-dba5-4cdd-95af-22e0648ed8b3');
update jobs set customer_id = '310a28dd-0452-49f3-b5d8-8c1905595e1e' where customer_id in ('5313831d-dba5-4cdd-95af-22e0648ed8b3');

-- Leon <- leon
update owned_vehicles set owner_id = '315e8bf2-5c72-4f8a-87af-166ec7aa0138' where owner_id in ('c9a0f622-8773-4402-a907-4fdffb67b31a');
update jobs set customer_id = '315e8bf2-5c72-4f8a-87af-166ec7aa0138' where customer_id in ('c9a0f622-8773-4402-a907-4fdffb67b31a');

-- Tara Blaine <- tara, Tara
update owned_vehicles set owner_id = 'aeac8c38-da22-41ca-9fb3-6ca47bb5f3cd' where owner_id in ('327b38b0-4332-42d5-8e52-0c87afd53fc0', '6dbe802b-a460-4917-829d-6342fb18a769');
update jobs set customer_id = 'aeac8c38-da22-41ca-9fb3-6ca47bb5f3cd' where customer_id in ('327b38b0-4332-42d5-8e52-0c87afd53fc0', '6dbe802b-a460-4917-829d-6342fb18a769');

-- Ian Freeman <- Ian
update owned_vehicles set owner_id = '786676f6-0e7e-4588-9cfc-ab7773089a38' where owner_id in ('34624f72-bf24-4c83-92e1-7a3a2efafdd3');
update jobs set customer_id = '786676f6-0e7e-4588-9cfc-ab7773089a38' where customer_id in ('34624f72-bf24-4c83-92e1-7a3a2efafdd3');

-- Jess <- jess
update owned_vehicles set owner_id = '348f7762-bd02-4e55-bb5e-ac746206ac09' where owner_id in ('7c5b4f04-8c78-44a9-8570-19fddaa92084');
update jobs set customer_id = '348f7762-bd02-4e55-bb5e-ac746206ac09' where customer_id in ('7c5b4f04-8c78-44a9-8570-19fddaa92084');

-- Bart Stantey <- Bart Stanley
update owned_vehicles set owner_id = '34a4c7c3-e877-48c4-8a11-93e1e62aec71' where owner_id in ('74cbfb09-0b34-44ee-aecd-ff103b4bf2b4');
update jobs set customer_id = '34a4c7c3-e877-48c4-8a11-93e1e62aec71' where customer_id in ('74cbfb09-0b34-44ee-aecd-ff103b4bf2b4');

-- Colton Vance <- Colton, colton
update owned_vehicles set owner_id = '357de4dc-0d95-4692-97a0-e0ef37454d5f' where owner_id in ('46585cb4-545b-4fbc-bc75-214dd69d1440', 'e4faa1b9-2c21-4e87-a5d2-995a5f2b9f7d');
update jobs set customer_id = '357de4dc-0d95-4692-97a0-e0ef37454d5f' where customer_id in ('46585cb4-545b-4fbc-bc75-214dd69d1440', 'e4faa1b9-2c21-4e87-a5d2-995a5f2b9f7d');

-- Enis Broja <- Enis, enis
update owned_vehicles set owner_id = 'c9ca7ed7-9150-4199-b095-529c9201acbe' where owner_id in ('359f815c-366d-4f0c-b4d5-8573ac6b9aed', '50adfc69-66e7-452b-81da-87f77fe2f53a');
update jobs set customer_id = 'c9ca7ed7-9150-4199-b095-529c9201acbe' where customer_id in ('359f815c-366d-4f0c-b4d5-8573ac6b9aed', '50adfc69-66e7-452b-81da-87f77fe2f53a');

-- Salvatore Lucianoo <- Salvatore, Salvatore Luciano
update owned_vehicles set owner_id = '35aadf51-10fd-429c-8d3e-5483b7e1219f' where owner_id in ('837fe4e4-49d2-465a-8a8f-b22a673df7db', '9ff01cc9-39b2-4dc8-8534-42a042df4263');
update jobs set customer_id = '35aadf51-10fd-429c-8d3e-5483b7e1219f' where customer_id in ('837fe4e4-49d2-465a-8a8f-b22a673df7db', '9ff01cc9-39b2-4dc8-8534-42a042df4263');

-- Billy <- billy
update owned_vehicles set owner_id = '4022ec37-adfb-436b-9a31-452ce2f875d2' where owner_id in ('35af344a-c680-47f9-ab4e-ba1cbd078890');
update jobs set customer_id = '4022ec37-adfb-436b-9a31-452ce2f875d2' where customer_id in ('35af344a-c680-47f9-ab4e-ba1cbd078890');

-- Carson Peters <- Carson
update owned_vehicles set owner_id = 'b72dcc61-9f8e-4bf1-a231-a0dfbcfa462a' where owner_id in ('3649c474-3656-423f-8f94-a91e4af3a8e5');
update jobs set customer_id = 'b72dcc61-9f8e-4bf1-a231-a0dfbcfa462a' where customer_id in ('3649c474-3656-423f-8f94-a91e4af3a8e5');

-- Vic Widowghast <- Vic Widowgast, Vic
update owned_vehicles set owner_id = 'f3d3d30a-59e6-4f76-b24f-5a6ad577b6f4' where owner_id in ('368b48ba-2fc2-4fe7-b2ca-643f21b31506', '90a737c7-5a0e-45ea-992c-93e0587aa2eb');
update jobs set customer_id = 'f3d3d30a-59e6-4f76-b24f-5a6ad577b6f4' where customer_id in ('368b48ba-2fc2-4fe7-b2ca-643f21b31506', '90a737c7-5a0e-45ea-992c-93e0587aa2eb');

-- Candy Buchanan <- Candy
update owned_vehicles set owner_id = '36a2c1f5-f4f5-4ac2-8a95-ba89fb03542f' where owner_id in ('8bb8778d-bc45-420a-8357-867443155083');
update jobs set customer_id = '36a2c1f5-f4f5-4ac2-8a95-ba89fb03542f' where customer_id in ('8bb8778d-bc45-420a-8357-867443155083');

-- Courtney Nichols <- Courtney
update owned_vehicles set owner_id = 'e2ec8fc1-4890-4a88-a98e-a38e3d81b6bf' where owner_id in ('36dcfd3e-080b-4ff6-b460-a8895d91bcef');
update jobs set customer_id = 'e2ec8fc1-4890-4a88-a98e-a38e3d81b6bf' where customer_id in ('36dcfd3e-080b-4ff6-b460-a8895d91bcef');

-- Herbert Sinclair <- Herbert
update owned_vehicles set owner_id = '36f029ec-acb4-42ae-8287-1b6d80bbb911' where owner_id in ('56f623ef-a5a9-4e23-960d-2ee83b9d44ad');
update jobs set customer_id = '36f029ec-acb4-42ae-8287-1b6d80bbb911' where customer_id in ('56f623ef-a5a9-4e23-960d-2ee83b9d44ad');

-- Jamie MacDonald <- Jamie, Jamie McDonald
update owned_vehicles set owner_id = '372f0035-811b-47db-8c90-f900fa71ca59' where owner_id in ('38c0679a-3038-4a92-9baa-abc5abe7334a', '7dea9b4d-7e71-431e-b560-05eac11a1d05');
update jobs set customer_id = '372f0035-811b-47db-8c90-f900fa71ca59' where customer_id in ('38c0679a-3038-4a92-9baa-abc5abe7334a', '7dea9b4d-7e71-431e-b560-05eac11a1d05');

-- Brooke Johnson <- Brooke
update owned_vehicles set owner_id = '38c3b1be-fea7-46ef-8d79-fba9a9d92aaf' where owner_id in ('9a517614-27ce-4cbe-b12c-3cb80b71e41a');
update jobs set customer_id = '38c3b1be-fea7-46ef-8d79-fba9a9d92aaf' where customer_id in ('9a517614-27ce-4cbe-b12c-3cb80b71e41a');

-- Scotty Law <- Scotty law
update owned_vehicles set owner_id = '38c534c7-347f-4180-a3d3-ba9abe271825' where owner_id in ('cb5d3432-b097-4f12-8334-25fcd6d55dd5');
update jobs set customer_id = '38c534c7-347f-4180-a3d3-ba9abe271825' where customer_id in ('cb5d3432-b097-4f12-8334-25fcd6d55dd5');

-- Amelia Lopez <- Amelia Loperz, Amelia
update owned_vehicles set owner_id = '392a8c7d-ca9e-432b-bb37-a3b096a46996' where owner_id in ('c7d39cd5-c4b0-4c29-9107-969bdb409a98', 'dbc7c44e-2615-4fd2-8568-83b30584e1c8');
update jobs set customer_id = '392a8c7d-ca9e-432b-bb37-a3b096a46996' where customer_id in ('c7d39cd5-c4b0-4c29-9107-969bdb409a98', 'dbc7c44e-2615-4fd2-8568-83b30584e1c8');

-- Sofia Moretti <- Sofia
update owned_vehicles set owner_id = '394c3f28-e2e9-459d-9cca-6a093c2bdbd2' where owner_id in ('963b98f6-6008-41df-a9a9-18dc7dcd8b6a');
update jobs set customer_id = '394c3f28-e2e9-459d-9cca-6a093c2bdbd2' where customer_id in ('963b98f6-6008-41df-a9a9-18dc7dcd8b6a');

-- Simon Joseph <- Simon
update owned_vehicles set owner_id = '770f750a-e287-4344-9d2c-d745c37be044' where owner_id in ('3b5c84f5-df23-426a-b6dd-fa2cf9b3f184');
update jobs set customer_id = '770f750a-e287-4344-9d2c-d745c37be044' where customer_id in ('3b5c84f5-df23-426a-b6dd-fa2cf9b3f184');

-- Stevy EM <- Stevy
update owned_vehicles set owner_id = '3bb80ada-0790-49d2-b1a2-585d061b2bc9' where owner_id in ('76c2a0be-6918-4912-915f-56ee71d2bdac');
update jobs set customer_id = '3bb80ada-0790-49d2-b1a2-585d061b2bc9' where customer_id in ('76c2a0be-6918-4912-915f-56ee71d2bdac');

-- Otarius Goldman <- Otarius GoldmanBlock, Otarius Goldman Brock, Otarius Goldman Block
update owned_vehicles set owner_id = 'dfe60873-4293-40f4-b4d3-eaec9ba2792d' where owner_id in ('3ccc2a27-136b-4387-9bb3-840206a75234', '76a6b156-f487-41e8-ac58-384610684bf4', 'f1eb80dd-345a-44a7-9544-e1748eaf23ce');
update jobs set customer_id = 'dfe60873-4293-40f4-b4d3-eaec9ba2792d' where customer_id in ('3ccc2a27-136b-4387-9bb3-840206a75234', '76a6b156-f487-41e8-ac58-384610684bf4', 'f1eb80dd-345a-44a7-9544-e1748eaf23ce');

-- tENNY rICKS <- Tenny
update owned_vehicles set owner_id = '3dfb1da5-ab9c-4502-a1be-b55b107108b6' where owner_id in ('3f350d17-425c-4448-8d3c-c19e0fe66a5e');
update jobs set customer_id = '3dfb1da5-ab9c-4502-a1be-b55b107108b6' where customer_id in ('3f350d17-425c-4448-8d3c-c19e0fe66a5e');

-- Keith Swan <- Keith
update owned_vehicles set owner_id = 'fec35110-5d05-4b7b-8129-adff7da8274f' where owner_id in ('3e41e164-1aa8-457b-81fe-5ef37882c755');
update jobs set customer_id = 'fec35110-5d05-4b7b-8129-adff7da8274f' where customer_id in ('3e41e164-1aa8-457b-81fe-5ef37882c755');

-- cj <- CJ
update owned_vehicles set owner_id = '3ef0b239-6c3b-4295-a11e-d22b07209176' where owner_id in ('6ee04795-c697-493f-b940-065a2c20c996');
update jobs set customer_id = '3ef0b239-6c3b-4295-a11e-d22b07209176' where customer_id in ('6ee04795-c697-493f-b940-065a2c20c996');

-- Cath <- cath
update owned_vehicles set owner_id = '7cff515f-181b-48a3-8a65-a26713b2a089' where owner_id in ('3ef9c00c-70ed-44fa-a675-bb914f90173f');
update jobs set customer_id = '7cff515f-181b-48a3-8a65-a26713b2a089' where customer_id in ('3ef9c00c-70ed-44fa-a675-bb914f90173f');

-- Johnny Ganton <- johnny, Johnny GANTON, Johnny, JOhnny
update owned_vehicles set owner_id = 'c50ec039-b21f-415c-a60e-568301e4a712' where owner_id in ('3fe948f5-dddb-4961-9803-7e07308b01de', '4678a885-dbcf-4621-8aec-29c999bb26f4', '68cde908-d156-4a5a-959f-ff8ca9d91e9c', 'f39db42f-7e0a-447a-a7de-1007a8a2021d');
update jobs set customer_id = 'c50ec039-b21f-415c-a60e-568301e4a712' where customer_id in ('3fe948f5-dddb-4961-9803-7e07308b01de', '4678a885-dbcf-4621-8aec-29c999bb26f4', '68cde908-d156-4a5a-959f-ff8ca9d91e9c', 'f39db42f-7e0a-447a-a7de-1007a8a2021d');

-- Shay Stevenson <- Shay
update owned_vehicles set owner_id = 'f1d142bc-23b6-4e61-b95c-da9813a6aaa8' where owner_id in ('4018d704-08dd-40c3-a0b4-596f6e7f4ff7');
update jobs set customer_id = 'f1d142bc-23b6-4e61-b95c-da9813a6aaa8' where customer_id in ('4018d704-08dd-40c3-a0b4-596f6e7f4ff7');

-- Raven Zellas <- Raven
update owned_vehicles set owner_id = 'a29f214b-02e2-49c1-93e1-ba3bf3260af8' where owner_id in ('404293b5-4919-4f32-a8ee-ff884543406a');
update jobs set customer_id = 'a29f214b-02e2-49c1-93e1-ba3bf3260af8' where customer_id in ('404293b5-4919-4f32-a8ee-ff884543406a');

-- Vito <- VITO, vito
update owned_vehicles set owner_id = 'ed526a29-fbc2-4ece-abf3-2c28dd218206' where owner_id in ('4075a17d-101d-4c19-b977-63ff16ef2114', '851ebb4b-e807-4c3e-bdbc-f95318b24abc');
update jobs set customer_id = 'ed526a29-fbc2-4ece-abf3-2c28dd218206' where customer_id in ('4075a17d-101d-4c19-b977-63ff16ef2114', '851ebb4b-e807-4c3e-bdbc-f95318b24abc');

-- Enzo Persico <- Enzo, Enzo Perisco
update owned_vehicles set owner_id = '417a1d45-ddc5-4859-82cb-87ff96108e60' where owner_id in ('f572013a-d497-4473-a468-757453c03dbd', 'f7dd3570-7583-438a-8c4d-2a435b29b480');
update jobs set customer_id = '417a1d45-ddc5-4859-82cb-87ff96108e60' where customer_id in ('f572013a-d497-4473-a468-757453c03dbd', 'f7dd3570-7583-438a-8c4d-2a435b29b480');

-- Jeremy Lancer <- jeremy, Jeremy
update owned_vehicles set owner_id = 'ec947833-f9d2-49ef-90ad-24c11b650e97' where owner_id in ('418807bf-8cea-4122-bae9-fc99bc360302', 'a31af50a-f1e8-4837-8b0d-c75484e22132');
update jobs set customer_id = 'ec947833-f9d2-49ef-90ad-24c11b650e97' where customer_id in ('418807bf-8cea-4122-bae9-fc99bc360302', 'a31af50a-f1e8-4837-8b0d-c75484e22132');

-- Antonio Bufalino <- Antonio Buffalino, antonio, Antonio
update owned_vehicles set owner_id = 'd0641514-6716-447a-926c-2b801eaf65d1' where owner_id in ('41dd9ed4-a7b9-4d42-a87b-2659fb4b7813', '82589670-a49f-44ea-b305-7239caa79234', 'fadd3c4a-ccb1-4646-9be5-f57685afaa14');
update jobs set customer_id = 'd0641514-6716-447a-926c-2b801eaf65d1' where customer_id in ('41dd9ed4-a7b9-4d42-a87b-2659fb4b7813', '82589670-a49f-44ea-b305-7239caa79234', 'fadd3c4a-ccb1-4646-9be5-f57685afaa14');

-- Justin Streets <- justin, Justin
update owned_vehicles set owner_id = '5fdd1d4b-59d7-4124-bfa9-f76e8bc04e52' where owner_id in ('4282dc22-36d7-4a68-90cd-9caa96a2de5d', 'd1ebb722-c35a-450e-ac9e-bc90556dbb1c');
update jobs set customer_id = '5fdd1d4b-59d7-4124-bfa9-f76e8bc04e52' where customer_id in ('4282dc22-36d7-4a68-90cd-9caa96a2de5d', 'd1ebb722-c35a-450e-ac9e-bc90556dbb1c');

-- Seb <- seb
update owned_vehicles set owner_id = '42889128-815d-475b-830e-69bee14b1de4' where owner_id in ('6bd39921-d03c-46b3-ae47-b094e12e49f5');
update jobs set customer_id = '42889128-815d-475b-830e-69bee14b1de4' where customer_id in ('6bd39921-d03c-46b3-ae47-b094e12e49f5');

-- Phil Dunn <- pHIL dUNN, phil
update owned_vehicles set owner_id = '5ead9c01-393b-453a-93c4-90ff81ce4508' where owner_id in ('42becc63-a059-46cc-998f-462b3423f5df', 'b316ddee-7ad4-48db-9bd9-3aad89811d7a');
update jobs set customer_id = '5ead9c01-393b-453a-93c4-90ff81ce4508' where customer_id in ('42becc63-a059-46cc-998f-462b3423f5df', 'b316ddee-7ad4-48db-9bd9-3aad89811d7a');

-- Nolan Phillips <- Nolan
update owned_vehicles set owner_id = 'd2cd5cbe-3676-4de1-a504-b50136e8308b' where owner_id in ('42f201d4-4012-4ee7-856c-470d350d71db');
update jobs set customer_id = 'd2cd5cbe-3676-4de1-a504-b50136e8308b' where customer_id in ('42f201d4-4012-4ee7-856c-470d350d71db');

-- Paddy O'Connell <- Paddy
update owned_vehicles set owner_id = '43419487-d646-431b-a51c-208c53748b83' where owner_id in ('d5ad0095-b2e0-4c55-af30-9c8c789d38e4');
update jobs set customer_id = '43419487-d646-431b-a51c-208c53748b83' where customer_id in ('d5ad0095-b2e0-4c55-af30-9c8c789d38e4');

-- Rian Graves <- Rian
update owned_vehicles set owner_id = '43481e96-bf6a-4167-956e-e7ed2021c279' where owner_id in ('aed3657b-b541-45d9-83a6-6c2c9805ba96');
update jobs set customer_id = '43481e96-bf6a-4167-956e-e7ed2021c279' where customer_id in ('aed3657b-b541-45d9-83a6-6c2c9805ba96');

-- Arlo Young <- Arlo
update owned_vehicles set owner_id = '442d593e-d8e2-4f43-a532-04f1c438c875' where owner_id in ('ab28f4a3-53e5-49e4-b91b-48defeb79001');
update jobs set customer_id = '442d593e-d8e2-4f43-a532-04f1c438c875' where customer_id in ('ab28f4a3-53e5-49e4-b91b-48defeb79001');

-- Alistair Blackthorn <- Alistair
update owned_vehicles set owner_id = '446b5a88-8db7-4da8-bdea-aaf7803ba418' where owner_id in ('9064e734-9149-4e0b-81ec-8df2d7b81958');
update jobs set customer_id = '446b5a88-8db7-4da8-bdea-aaf7803ba418' where customer_id in ('9064e734-9149-4e0b-81ec-8df2d7b81958');

-- Poe Tate <- POE, Poe
update owned_vehicles set owner_id = 'bfd67ab3-2e59-44ef-b96a-e01c41bb01fd' where owner_id in ('46c5ed14-450e-43fc-905e-0bed6ad0de9d', 'ded78b8e-1c86-48a3-8924-8820b804f777');
update jobs set customer_id = 'bfd67ab3-2e59-44ef-b96a-e01c41bb01fd' where customer_id in ('46c5ed14-450e-43fc-905e-0bed6ad0de9d', 'ded78b8e-1c86-48a3-8924-8820b804f777');

-- Rusty Rhodes <- Rusty
update owned_vehicles set owner_id = '46f0b51d-4d92-474a-ae9d-d9392bdc9a3c' where owner_id in ('83277404-7582-4ea6-9745-0da548281089');
update jobs set customer_id = '46f0b51d-4d92-474a-ae9d-d9392bdc9a3c' where customer_id in ('83277404-7582-4ea6-9745-0da548281089');

-- Edward Chan <- Edward
update owned_vehicles set owner_id = '6e3f6d59-9699-491b-bff7-218c8cc751f2' where owner_id in ('47d82c40-c824-4029-8694-203d9618bfdd');
update jobs set customer_id = '6e3f6d59-9699-491b-bff7-218c8cc751f2' where customer_id in ('47d82c40-c824-4029-8694-203d9618bfdd');

-- Reece Hat <- Reece
update owned_vehicles set owner_id = '5ebf0844-a318-4009-8f30-43f2501538ba' where owner_id in ('4804d178-cd8b-4e94-be42-551ca6314a87');
update jobs set customer_id = '5ebf0844-a318-4009-8f30-43f2501538ba' where customer_id in ('4804d178-cd8b-4e94-be42-551ca6314a87');

-- Reggie Oakland <- Reggie
update owned_vehicles set owner_id = '95c13f4b-e740-41e8-90af-9ff01a4fca02' where owner_id in ('49a40c77-7332-43a5-a556-b588dc1524d7');
update jobs set customer_id = '95c13f4b-e740-41e8-90af-9ff01a4fca02' where customer_id in ('49a40c77-7332-43a5-a556-b588dc1524d7');

-- Jericho Cochas <- Jericho
update owned_vehicles set owner_id = '4a83d2ea-bdac-4b69-9881-48141bcef616' where owner_id in ('703d1ade-b54f-437c-a595-fae9ac999470');
update jobs set customer_id = '4a83d2ea-bdac-4b69-9881-48141bcef616' where customer_id in ('703d1ade-b54f-437c-a595-fae9ac999470');

-- Mufasa Volkov <- mufasa
update owned_vehicles set owner_id = '75c44ee6-f484-4962-9e5b-a594ac9f80f9' where owner_id in ('4acae278-9b40-4d9b-a57d-35b79dbbf8a8');
update jobs set customer_id = '75c44ee6-f484-4962-9e5b-a594ac9f80f9' where customer_id in ('4acae278-9b40-4d9b-a57d-35b79dbbf8a8');

-- Fogel McLovin <- fogel
update owned_vehicles set owner_id = '4ad93823-86c5-4dfb-a158-99923a042a13' where owner_id in ('ff446cd0-535d-43a1-9dfd-fda7169a37a2');
update jobs set customer_id = '4ad93823-86c5-4dfb-a158-99923a042a13' where customer_id in ('ff446cd0-535d-43a1-9dfd-fda7169a37a2');

-- Nikolas <- nikolas
update owned_vehicles set owner_id = '4b2c412b-e512-43a9-bf04-48d7479c573b' where owner_id in ('96b0ca5c-8ab8-4597-9899-c1359f017318');
update jobs set customer_id = '4b2c412b-e512-43a9-bf04-48d7479c573b' where customer_id in ('96b0ca5c-8ab8-4597-9899-c1359f017318');

-- Eli Baker <- eLI bAKER
update owned_vehicles set owner_id = 'b8df81fb-3736-499d-9646-3be820b61fb3' where owner_id in ('4b5eb153-4f44-4d99-91c4-9803018bdd18');
update jobs set customer_id = 'b8df81fb-3736-499d-9646-3be820b61fb3' where customer_id in ('4b5eb153-4f44-4d99-91c4-9803018bdd18');

-- Monroe Mcmogger <- monroe
update owned_vehicles set owner_id = 'c5c77df2-e7c2-4b20-9b41-4800c00f52c6' where owner_id in ('4b6552c7-0fb0-4ee0-abf8-1108bc44504a');
update jobs set customer_id = 'c5c77df2-e7c2-4b20-9b41-4800c00f52c6' where customer_id in ('4b6552c7-0fb0-4ee0-abf8-1108bc44504a');

-- Stephen Walker <- Stephen
update owned_vehicles set owner_id = '4c0058c8-0004-467a-a685-e65a96054f0a' where owner_id in ('a3e6a352-ab7a-4960-aa06-c1223d8f901f');
update jobs set customer_id = '4c0058c8-0004-467a-a685-e65a96054f0a' where customer_id in ('a3e6a352-ab7a-4960-aa06-c1223d8f901f');

-- Johno Murphy <- Johno, JOhno
update owned_vehicles set owner_id = '879c627f-646c-482c-92ec-9250dbf354f9' where owner_id in ('4eabe73a-646f-4848-9564-b7ecc1fad6cd', 'e2227aeb-2970-4acc-86f5-253c87da7094');
update jobs set customer_id = '879c627f-646c-482c-92ec-9250dbf354f9' where customer_id in ('4eabe73a-646f-4848-9564-b7ecc1fad6cd', 'e2227aeb-2970-4acc-86f5-253c87da7094');

-- Cassian Vale <- Cassian
update owned_vehicles set owner_id = '7dfeae0b-ee63-41dd-9f40-b8114efa215d' where owner_id in ('4ee5a7ae-668b-42b3-b6b8-787fe0db56e7');
update jobs set customer_id = '7dfeae0b-ee63-41dd-9f40-b8114efa215d' where customer_id in ('4ee5a7ae-668b-42b3-b6b8-787fe0db56e7');

-- Adam <- adam
update owned_vehicles set owner_id = '4ef786b5-6873-4371-b4d3-44cf344d7e47' where owner_id in ('6f8b76f8-d1d3-4635-a26b-f33ef77d30f7');
update jobs set customer_id = '4ef786b5-6873-4371-b4d3-44cf344d7e47' where customer_id in ('6f8b76f8-d1d3-4635-a26b-f33ef77d30f7');

-- Ezekiel Carter <- Ezekiel
update owned_vehicles set owner_id = '4f07ca92-1d5b-47f5-a679-a3e82e2f9ffe' where owner_id in ('f70cf04a-b55c-4c16-bac5-bcbdb8d31596');
update jobs set customer_id = '4f07ca92-1d5b-47f5-a679-a3e82e2f9ffe' where customer_id in ('f70cf04a-b55c-4c16-bac5-bcbdb8d31596');

-- Jason <- JAson, jason
update owned_vehicles set owner_id = '4f0ce297-785b-4c9d-a49a-88f253d6eee2' where owner_id in ('c187fd53-091a-40cf-8a5a-2c48faead386', 'cf422e9b-ec09-48cb-8e85-17e19653a435');
update jobs set customer_id = '4f0ce297-785b-4c9d-a49a-88f253d6eee2' where customer_id in ('c187fd53-091a-40cf-8a5a-2c48faead386', 'cf422e9b-ec09-48cb-8e85-17e19653a435');

-- Austin Wolfe <- Austin, Austin Wolfie
update owned_vehicles set owner_id = '80be67f1-fc84-43e2-a9a9-0c614bfe7dfc' where owner_id in ('4f2e6334-3b2c-4177-9ef6-91a9cdfbd00b', '911db222-ef8b-4901-a45f-b9697062cdb2');
update jobs set customer_id = '80be67f1-fc84-43e2-a9a9-0c614bfe7dfc' where customer_id in ('4f2e6334-3b2c-4177-9ef6-91a9cdfbd00b', '911db222-ef8b-4901-a45f-b9697062cdb2');

-- Ohtkya GAMBI <- ohtkya, Ohtkya
update owned_vehicles set owner_id = 'bd1e95ac-4c4a-44c9-bc86-c6f77d7da91b' where owner_id in ('5058fcab-8f6c-4230-9d58-ffbafb5248dd', '96f771f9-8c39-4ba6-97dd-cea83e57c504');
update jobs set customer_id = 'bd1e95ac-4c4a-44c9-bc86-c6f77d7da91b' where customer_id in ('5058fcab-8f6c-4230-9d58-ffbafb5248dd', '96f771f9-8c39-4ba6-97dd-cea83e57c504');

-- Gio <- gio
update owned_vehicles set owner_id = 'c4daa104-c7d4-4808-b066-8a8ec67a026d' where owner_id in ('5065d55d-5c5b-439b-892a-328b1c455ce2');
update jobs set customer_id = 'c4daa104-c7d4-4808-b066-8a8ec67a026d' where customer_id in ('5065d55d-5c5b-439b-892a-328b1c455ce2');

-- Jon <- jon
update owned_vehicles set owner_id = '507c61c5-8549-427a-8412-bf9d1a5270bd' where owner_id in ('b5f81b55-d253-4eca-9763-57ba1ee94fb1');
update jobs set customer_id = '507c61c5-8549-427a-8412-bf9d1a5270bd' where customer_id in ('b5f81b55-d253-4eca-9763-57ba1ee94fb1');

-- Eric Carter <- Eric
update owned_vehicles set owner_id = 'c8b8bd2b-da0d-4ea5-a6c1-e520cf764a97' where owner_id in ('520810c3-8a5b-4064-b346-2e64fd36d61b');
update jobs set customer_id = 'c8b8bd2b-da0d-4ea5-a6c1-e520cf764a97' where customer_id in ('520810c3-8a5b-4064-b346-2e64fd36d61b');

-- Travis Noble <- Travis
update owned_vehicles set owner_id = '5261584d-8ed9-4fc2-8fad-cdf9d1b831bd' where owner_id in ('90691f57-e582-4f9d-8abf-27021909441b');
update jobs set customer_id = '5261584d-8ed9-4fc2-8fad-cdf9d1b831bd' where customer_id in ('90691f57-e582-4f9d-8abf-27021909441b');

-- Lucifer Volkov <- Lucifer, Lucifer Volkvo, lucifer, Lucifer Vokov, Lucifer Volkv
update owned_vehicles set owner_id = '52784738-30e4-42fe-9629-4c74c8f28a3e' where owner_id in ('6132605a-c35d-4817-89f0-82dfe452ab59', '64e7b7e3-655c-4f69-8ed0-afc71d25d54d', '80ce9ef4-d7bf-48e6-a210-d2288394d3ae', '8b1716d9-962e-4960-a604-574e7dc45058', 'caed4896-4ffd-4c72-b4ac-62b214be3a8e');
update jobs set customer_id = '52784738-30e4-42fe-9629-4c74c8f28a3e' where customer_id in ('6132605a-c35d-4817-89f0-82dfe452ab59', '64e7b7e3-655c-4f69-8ed0-afc71d25d54d', '80ce9ef4-d7bf-48e6-a210-d2288394d3ae', '8b1716d9-962e-4960-a604-574e7dc45058', 'caed4896-4ffd-4c72-b4ac-62b214be3a8e');

-- Dale McLleland <- Dale
update owned_vehicles set owner_id = '77d39d83-a008-4638-9d5c-eebfe05dd445' where owner_id in ('52888386-860e-4fde-b594-40ca3bf410c2');
update jobs set customer_id = '77d39d83-a008-4638-9d5c-eebfe05dd445' where customer_id in ('52888386-860e-4fde-b594-40ca3bf410c2');

-- Lev <- lev
update owned_vehicles set owner_id = '5360cf2c-1178-41d5-a5d4-0ed3d1bb05d1' where owner_id in ('f2584659-1d76-412e-b843-239a0a2fa7f3');
update jobs set customer_id = '5360cf2c-1178-41d5-a5d4-0ed3d1bb05d1' where customer_id in ('f2584659-1d76-412e-b843-239a0a2fa7f3');

-- Milyra Burnaman <- Milyra
update owned_vehicles set owner_id = 'c5415a6e-60ac-4e61-b67f-d7d977ccab28' where owner_id in ('536fc775-a3bb-4b33-a7c2-563ded2d7ea6');
update jobs set customer_id = 'c5415a6e-60ac-4e61-b67f-d7d977ccab28' where customer_id in ('536fc775-a3bb-4b33-a7c2-563ded2d7ea6');

-- Rook Peterson <- Rook
update owned_vehicles set owner_id = '99318e2c-d3d5-4993-8abb-bb05fedab1f0' where owner_id in ('53d89ca4-1bf6-47ef-a4b6-53d960a47fc9');
update jobs set customer_id = '99318e2c-d3d5-4993-8abb-bb05fedab1f0' where customer_id in ('53d89ca4-1bf6-47ef-a4b6-53d960a47fc9');

-- Tim Voss <- Tim, tim
update owned_vehicles set owner_id = 'abd79078-3aff-4ac4-9a5e-20fef0558333' where owner_id in ('53edf996-6a80-4423-81ed-69af69a1da6b', 'ed28b70f-240e-45dd-83b6-c05eff7e3e32');
update jobs set customer_id = 'abd79078-3aff-4ac4-9a5e-20fef0558333' where customer_id in ('53edf996-6a80-4423-81ed-69af69a1da6b', 'ed28b70f-240e-45dd-83b6-c05eff7e3e32');

-- Nicki Ricki <- Nicki
update owned_vehicles set owner_id = 'e80bb2f2-e4b2-4df0-bfca-966299670afd' where owner_id in ('53ff7ad8-1f4f-4333-afa6-9ffe6d1d1097');
update jobs set customer_id = 'e80bb2f2-e4b2-4df0-bfca-966299670afd' where customer_id in ('53ff7ad8-1f4f-4333-afa6-9ffe6d1d1097');

-- Ant Jones <- Ant Jopnes, Ant
update owned_vehicles set owner_id = 'ac8c21e1-a0c8-4b58-b9ff-b130e0fdbb0c' where owner_id in ('543c164c-7db2-4c6f-98a8-5f3624d89e50', 'a7c26507-8110-4005-b224-99b06228cc3a');
update jobs set customer_id = 'ac8c21e1-a0c8-4b58-b9ff-b130e0fdbb0c' where customer_id in ('543c164c-7db2-4c6f-98a8-5f3624d89e50', 'a7c26507-8110-4005-b224-99b06228cc3a');

-- Lem <- lEM, lem
update owned_vehicles set owner_id = '54807887-2b52-4869-91f1-b603c5ceeb03' where owner_id in ('6ebf8a56-e20e-4d7b-b3dd-3cfab7f038ca', '7fb488fe-f29c-4ed1-84ce-e204c1a43e16');
update jobs set customer_id = '54807887-2b52-4869-91f1-b603c5ceeb03' where customer_id in ('6ebf8a56-e20e-4d7b-b3dd-3cfab7f038ca', '7fb488fe-f29c-4ed1-84ce-e204c1a43e16');

-- Aleksi Makela <- Aleksi, aleksi
update owned_vehicles set owner_id = 'ddb016b8-1ffc-4742-bbc2-ace51a0a7f57' where owner_id in ('557156ba-fdb9-437b-a82e-d85aadb18db8', 'ae676e70-8896-4078-ab34-7f19bae572d9');
update jobs set customer_id = 'ddb016b8-1ffc-4742-bbc2-ace51a0a7f57' where customer_id in ('557156ba-fdb9-437b-a82e-d85aadb18db8', 'ae676e70-8896-4078-ab34-7f19bae572d9');

-- Guy Laflamme <- Guy
update owned_vehicles set owner_id = 'a139105c-4f7b-4f86-9fbc-3a2e375fd585' where owner_id in ('55c51a1a-5397-409a-b2d7-642c3dffa7ba');
update jobs set customer_id = 'a139105c-4f7b-4f86-9fbc-3a2e375fd585' where customer_id in ('55c51a1a-5397-409a-b2d7-642c3dffa7ba');

-- Curtis Jacksaon <- Curtis Jackson, Curtis
update owned_vehicles set owner_id = '563c6f58-4994-4df9-bae2-42b59c9e46f8' where owner_id in ('7b49bce7-ec7b-49fc-bdc4-f732bb9ca168', 'f58034b5-1217-44bf-8b42-5f78a61ac53d');
update jobs set customer_id = '563c6f58-4994-4df9-bae2-42b59c9e46f8' where customer_id in ('7b49bce7-ec7b-49fc-bdc4-f732bb9ca168', 'f58034b5-1217-44bf-8b42-5f78a61ac53d');

-- Barb <- barb
update owned_vehicles set owner_id = '6a3a3d54-9b5e-4a6e-b957-d55fafaf7a6d' where owner_id in ('566f6815-0671-4256-b1d8-9a6f373aa8f6');
update jobs set customer_id = '6a3a3d54-9b5e-4a6e-b957-d55fafaf7a6d' where customer_id in ('566f6815-0671-4256-b1d8-9a6f373aa8f6');

-- Jack Offerman <- jack, Jack OFFERMAN, Jack, JACK
update owned_vehicles set owner_id = '594beaab-f13a-4a64-8a1e-b457d0730f18' where owner_id in ('7490d706-73da-4852-8614-5fdab4672e98', 'b75df961-cbdf-4893-9ba4-880f6ec1bfe3', 'd5cbff86-8939-4000-9997-103d832ae394', 'fa64fa33-5271-488e-ada2-182af00a351e');
update jobs set customer_id = '594beaab-f13a-4a64-8a1e-b457d0730f18' where customer_id in ('7490d706-73da-4852-8614-5fdab4672e98', 'b75df961-cbdf-4893-9ba4-880f6ec1bfe3', 'd5cbff86-8939-4000-9997-103d832ae394', 'fa64fa33-5271-488e-ada2-182af00a351e');

-- Fern Winterbloom <- Fern
update owned_vehicles set owner_id = '5f47cfb2-070d-4afa-ad94-e516844db3c5' where owner_id in ('59e11f3c-2bf6-49b3-a5a9-3f57a3d297a0');
update jobs set customer_id = '5f47cfb2-070d-4afa-ad94-e516844db3c5' where customer_id in ('59e11f3c-2bf6-49b3-a5a9-3f57a3d297a0');

-- Chuck McAllister <- Chuck
update owned_vehicles set owner_id = '5ad65b5f-3aac-4551-8584-d18ec13fa0e7' where owner_id in ('bb462bc5-97cd-44ba-9195-7070f740582f');
update jobs set customer_id = '5ad65b5f-3aac-4551-8584-d18ec13fa0e7' where customer_id in ('bb462bc5-97cd-44ba-9195-7070f740582f');

-- Jaden Williams <- Jaden
update owned_vehicles set owner_id = '6180d3a9-7e37-4061-a81c-676d52054d51' where owner_id in ('5bb44635-299d-4e8f-aafe-93537649ff97');
update jobs set customer_id = '6180d3a9-7e37-4061-a81c-676d52054d51' where customer_id in ('5bb44635-299d-4e8f-aafe-93537649ff97');

-- Ryan Smalls <- ryan, Ryan Small, Ryan
update owned_vehicles set owner_id = 'd1941e77-d02e-4529-a3e9-b4928e13fb81' where owner_id in ('5c2e2841-f4b3-4846-9cd8-9d1cf74a0208', '810795c1-4d1a-4426-bf1a-5dffe628cc00', 'dedba3d9-8646-47ab-af79-9df8d80a0796');
update jobs set customer_id = 'd1941e77-d02e-4529-a3e9-b4928e13fb81' where customer_id in ('5c2e2841-f4b3-4846-9cd8-9d1cf74a0208', '810795c1-4d1a-4426-bf1a-5dffe628cc00', 'dedba3d9-8646-47ab-af79-9df8d80a0796');

-- Summer Franlklin <- Summer
update owned_vehicles set owner_id = '6ffaf1c8-38ad-4141-aec6-e149ecb4f164' where owner_id in ('5c325528-dc26-4af5-88ab-86edc1bd81e7');
update jobs set customer_id = '6ffaf1c8-38ad-4141-aec6-e149ecb4f164' where customer_id in ('5c325528-dc26-4af5-88ab-86edc1bd81e7');

-- Randy <- RANDY, randy
update owned_vehicles set owner_id = '5dfc9085-3f54-4a28-863d-4f09492337fa' where owner_id in ('83c5a0b1-af4f-4d7b-94ab-f8426f1fe669', 'd78c0f34-d6b4-4483-9ce5-3e671b756c0e');
update jobs set customer_id = '5dfc9085-3f54-4a28-863d-4f09492337fa' where customer_id in ('83c5a0b1-af4f-4d7b-94ab-f8426f1fe669', 'd78c0f34-d6b4-4483-9ce5-3e671b756c0e');

-- Cash Reiss <- Cash
update owned_vehicles set owner_id = 'cfd018ee-d6ed-406a-9261-927588207081' where owner_id in ('5e8c5590-9cb3-4061-a316-92a02f8178a7');
update jobs set customer_id = 'cfd018ee-d6ed-406a-9261-927588207081' where customer_id in ('5e8c5590-9cb3-4061-a316-92a02f8178a7');

-- Elias Browning <- Elias
update owned_vehicles set owner_id = '5f2fd907-52ca-406b-ae4c-769367aaa897' where owner_id in ('83759f0e-33dd-4931-b7fc-90d3834337cb');
update jobs set customer_id = '5f2fd907-52ca-406b-ae4c-769367aaa897' where customer_id in ('83759f0e-33dd-4931-b7fc-90d3834337cb');

-- Xing Chao <- xing
update owned_vehicles set owner_id = 'f103b96c-89b6-46f9-bea3-b0a499d0be2c' where owner_id in ('6115f2bc-0c0c-41b0-83d9-8bba60ae6097');
update jobs set customer_id = 'f103b96c-89b6-46f9-bea3-b0a499d0be2c' where customer_id in ('6115f2bc-0c0c-41b0-83d9-8bba60ae6097');

-- Moosey Burnaman <- Moosey Burnman
update owned_vehicles set owner_id = '611c7052-646c-465f-a8e4-1a10cb384678' where owner_id in ('94780de4-78c9-46dc-bc2f-3ba325a89e36');
update jobs set customer_id = '611c7052-646c-465f-a8e4-1a10cb384678' where customer_id in ('94780de4-78c9-46dc-bc2f-3ba325a89e36');

-- Koops Kassanovaa <- Koops
update owned_vehicles set owner_id = 'ebfb2088-f9b5-4ce6-b326-27b2c541e00e' where owner_id in ('629476a0-ccd4-4dc1-84c5-a76d512b2e88');
update jobs set customer_id = 'ebfb2088-f9b5-4ce6-b326-27b2c541e00e' where customer_id in ('629476a0-ccd4-4dc1-84c5-a76d512b2e88');

-- Layne Landry <- LAYNE, layne, Layne
update owned_vehicles set owner_id = '8e7a0d10-afef-424e-ac01-dda0ee8210c0' where owner_id in ('62a9d7a4-922d-4a2c-b650-f571ac38b77b', '9fe73a3a-394d-4c5b-b35b-dd73b4198eae', 'eb47a8d3-d2b0-47d8-af5c-09fa9e475c9d');
update jobs set customer_id = '8e7a0d10-afef-424e-ac01-dda0ee8210c0' where customer_id in ('62a9d7a4-922d-4a2c-b650-f571ac38b77b', '9fe73a3a-394d-4c5b-b35b-dd73b4198eae', 'eb47a8d3-d2b0-47d8-af5c-09fa9e475c9d');

-- Logan <- LOGAN, logan
update owned_vehicles set owner_id = '63b1e829-d219-4b54-b768-5a8bfe4b870d' where owner_id in ('b53b70be-13a4-4c5c-9a73-dff90f5c164a', 'bf1fb23e-708e-4bf9-a1a0-2b476ab04ccd');
update jobs set customer_id = '63b1e829-d219-4b54-b768-5a8bfe4b870d' where customer_id in ('b53b70be-13a4-4c5c-9a73-dff90f5c164a', 'bf1fb23e-708e-4bf9-a1a0-2b476ab04ccd');

-- William Hartswell <- William HARTSWELL, William
update owned_vehicles set owner_id = '9a514718-dbcf-471b-873f-dc922275630a' where owner_id in ('649170db-b2bb-430d-bb72-6998b1ffedee', 'bdc22041-940e-47c6-a141-10ff280f66d0');
update jobs set customer_id = '9a514718-dbcf-471b-873f-dc922275630a' where customer_id in ('649170db-b2bb-430d-bb72-6998b1ffedee', 'bdc22041-940e-47c6-a141-10ff280f66d0');

-- Ken <- KEN
update owned_vehicles set owner_id = '6607b790-34db-4a40-ac95-276e400c5a5a' where owner_id in ('678d6f09-aa09-4fa7-b31f-d96bdfd84e11');
update jobs set customer_id = '6607b790-34db-4a40-ac95-276e400c5a5a' where customer_id in ('678d6f09-aa09-4fa7-b31f-d96bdfd84e11');

-- Victor Ninov <- Victor NINOV
update owned_vehicles set owner_id = '66446a16-ee6b-4776-aac7-d39e9685b769' where owner_id in ('e1769466-e56a-41fc-b5d5-e199267c67e3');
update jobs set customer_id = '66446a16-ee6b-4776-aac7-d39e9685b769' where customer_id in ('e1769466-e56a-41fc-b5d5-e199267c67e3');

-- Molly Mahomes <- Molly
update owned_vehicles set owner_id = '66bcef24-304f-4c49-b79a-9b091a0d0cef' where owner_id in ('a3ea0fbc-9d1d-4871-a3cf-67acca98179d');
update jobs set customer_id = '66bcef24-304f-4c49-b79a-9b091a0d0cef' where customer_id in ('a3ea0fbc-9d1d-4871-a3cf-67acca98179d');

-- Ging Krivitsky <- Ging, ging
update owned_vehicles set owner_id = '7c74ef9a-93bb-4c44-a0a4-344bc33736b8' where owner_id in ('673f7ae1-48b9-4eed-acef-c70b9d62c0d8', '6b2b0581-ddcc-44a4-8d97-ce6d1ab82381');
update jobs set customer_id = '7c74ef9a-93bb-4c44-a0a4-344bc33736b8' where customer_id in ('673f7ae1-48b9-4eed-acef-c70b9d62c0d8', '6b2b0581-ddcc-44a4-8d97-ce6d1ab82381');

-- Izzie Monroe <- Izzie
update owned_vehicles set owner_id = '8880a63d-b319-42bc-a769-9bef1b032fef' where owner_id in ('6749e88b-bf40-488b-9cff-eac2e26db27a');
update jobs set customer_id = '8880a63d-b319-42bc-a769-9bef1b032fef' where customer_id in ('6749e88b-bf40-488b-9cff-eac2e26db27a');

-- Cherry Riott <- Cherry
update owned_vehicles set owner_id = 'e7549f38-da12-41d0-9193-4931d94274a1' where owner_id in ('67f31f51-d5db-43d8-8903-0c1ca651163d');
update jobs set customer_id = 'e7549f38-da12-41d0-9193-4931d94274a1' where customer_id in ('67f31f51-d5db-43d8-8903-0c1ca651163d');

-- Zeph Dubois <- Zeph
update owned_vehicles set owner_id = 'def1c242-b3d5-437e-ad32-7dfcef764d4c' where owner_id in ('691de85b-a121-401a-8cd7-bb622d8d685a');
update jobs set customer_id = 'def1c242-b3d5-437e-ad32-7dfcef764d4c' where customer_id in ('691de85b-a121-401a-8cd7-bb622d8d685a');

-- Aisling Rose <- Aisling
update owned_vehicles set owner_id = 'cdf49fc2-1d0d-44ba-8a91-37c1e9608e37' where owner_id in ('69b0c867-4efd-4a86-bc28-f5b82ee353e7');
update jobs set customer_id = 'cdf49fc2-1d0d-44ba-8a91-37c1e9608e37' where customer_id in ('69b0c867-4efd-4a86-bc28-f5b82ee353e7');

-- John Tarot <- John  Tarot, John, JOhn Tarot, John TArot, JOhn
update owned_vehicles set owner_id = '732580f9-651c-4185-9817-94b130e86e9b' where owner_id in ('6a1f0eaa-8194-4dac-a8d3-2286d34817df', '930485f3-0dc6-45f6-b448-427cb6cdf4ff', 'a5c845cc-6ed4-46cb-8c15-459af9ecd2c8', 'de5547f7-fabf-4284-8a85-e6a2dfa9a8c3', 'f193c29e-dbab-4e6f-bbc3-aa9d0b1003c8');
update jobs set customer_id = '732580f9-651c-4185-9817-94b130e86e9b' where customer_id in ('6a1f0eaa-8194-4dac-a8d3-2286d34817df', '930485f3-0dc6-45f6-b448-427cb6cdf4ff', 'a5c845cc-6ed4-46cb-8c15-459af9ecd2c8', 'de5547f7-fabf-4284-8a85-e6a2dfa9a8c3', 'f193c29e-dbab-4e6f-bbc3-aa9d0b1003c8');

-- Emi Limo <- Emi
update owned_vehicles set owner_id = '6b9eb2fa-7b17-4809-b082-d7d666f5fca7' where owner_id in ('b9d645db-b672-46ee-8965-26080062ec56');
update jobs set customer_id = '6b9eb2fa-7b17-4809-b082-d7d666f5fca7' where customer_id in ('b9d645db-b672-46ee-8965-26080062ec56');

-- Andrew <- andrew
update owned_vehicles set owner_id = 'ece1c71b-514f-4c9b-bd49-25b9aad4d7ed' where owner_id in ('6cc10f8b-18d7-4ca9-819f-be12f57523b1');
update jobs set customer_id = 'ece1c71b-514f-4c9b-bd49-25b9aad4d7ed' where customer_id in ('6cc10f8b-18d7-4ca9-819f-be12f57523b1');

-- Tempest <- tempest
update owned_vehicles set owner_id = '9d0ca341-5908-490a-b956-5d994b8ec2c1' where owner_id in ('6f0b048a-edd2-4b1b-8f04-c87f983c1299');
update jobs set customer_id = '9d0ca341-5908-490a-b956-5d994b8ec2c1' where customer_id in ('6f0b048a-edd2-4b1b-8f04-c87f983c1299');

-- Franklin MacDonald <- Franklin Macdonald, Franklin
update owned_vehicles set owner_id = 'b70f57cc-516c-4701-9c89-e66e5a0568f5' where owner_id in ('6f6f412b-d874-4f1a-9f5e-d6039fcc53a5', 'd63ae18d-f03c-4a1e-b295-dd893e74b627');
update jobs set customer_id = 'b70f57cc-516c-4701-9c89-e66e5a0568f5' where customer_id in ('6f6f412b-d874-4f1a-9f5e-d6039fcc53a5', 'd63ae18d-f03c-4a1e-b295-dd893e74b627');

-- Jane Doe <- Jane, jane
update owned_vehicles set owner_id = '7381d750-3c43-4188-a3f3-d57501eca520' where owner_id in ('713ce8ce-3aff-4e32-99e9-d2393464fc66', '897dd6ef-cfbf-41f1-9485-21e76fd95031');
update jobs set customer_id = '7381d750-3c43-4188-a3f3-d57501eca520' where customer_id in ('713ce8ce-3aff-4e32-99e9-d2393464fc66', '897dd6ef-cfbf-41f1-9485-21e76fd95031');

-- Andre Johnson <- Andre
update owned_vehicles set owner_id = '73b47fc8-e7b8-4df4-9d1f-c38090660c0f' where owner_id in ('71a0b759-3404-4297-b9e5-11c423219fab');
update jobs set customer_id = '73b47fc8-e7b8-4df4-9d1f-c38090660c0f' where customer_id in ('71a0b759-3404-4297-b9e5-11c423219fab');

-- JT <- jt
update owned_vehicles set owner_id = '73686fdc-fa64-4b96-b3e6-dfa944bfb340' where owner_id in ('90b09af6-69d8-4c29-8c32-d34a578a9c72');
update jobs set customer_id = '73686fdc-fa64-4b96-b3e6-dfa944bfb340' where customer_id in ('90b09af6-69d8-4c29-8c32-d34a578a9c72');

-- Chris Gentry <- chris gentry, Chris GENTRY, Chris gentry, Chris
update owned_vehicles set owner_id = '8a1fe044-6575-4753-b2a9-5b85325278bd' where owner_id in ('74d6e6c7-9622-4aa3-aba9-81066e25e519', '8aaea649-4702-42ae-8835-d17261f74f56', '9452b24d-6bb3-4536-96f2-c8499adef99a', 'bf02b0c9-3734-45b4-95b5-e6db8d93dd0c');
update jobs set customer_id = '8a1fe044-6575-4753-b2a9-5b85325278bd' where customer_id in ('74d6e6c7-9622-4aa3-aba9-81066e25e519', '8aaea649-4702-42ae-8835-d17261f74f56', '9452b24d-6bb3-4536-96f2-c8499adef99a', 'bf02b0c9-3734-45b4-95b5-e6db8d93dd0c');

-- Danny <- danny
update owned_vehicles set owner_id = 'c94a919b-0ffd-4d24-b9f3-335988e7e72f' where owner_id in ('7566c0a4-4eaa-40d1-bbcf-73164303185f');
update jobs set customer_id = 'c94a919b-0ffd-4d24-b9f3-335988e7e72f' where customer_id in ('7566c0a4-4eaa-40d1-bbcf-73164303185f');

-- Tyler <- tyler, TYLER
update owned_vehicles set owner_id = '75c32bcd-8105-4773-8352-f5efba66bcfa' where owner_id in ('7c200922-d5cf-4d6a-bbf7-ea39ba81c88b', 'b3efcdd4-145e-43f8-90ce-f80c85f14583');
update jobs set customer_id = '75c32bcd-8105-4773-8352-f5efba66bcfa' where customer_id in ('7c200922-d5cf-4d6a-bbf7-ea39ba81c88b', 'b3efcdd4-145e-43f8-90ce-f80c85f14583');

-- Esteban <- esteban
update owned_vehicles set owner_id = '8e66305d-63e1-4bad-a483-de2b9924d60d' where owner_id in ('78f16ffd-679a-4b81-aac2-73566010a3ad');
update jobs set customer_id = '8e66305d-63e1-4bad-a483-de2b9924d60d' where customer_id in ('78f16ffd-679a-4b81-aac2-73566010a3ad');

-- Heather <- heather
update owned_vehicles set owner_id = '796001ba-e841-44d1-ab6f-5360318d3931' where owner_id in ('b7726d89-93a1-4278-9435-11aba8797b0e');
update jobs set customer_id = '796001ba-e841-44d1-ab6f-5360318d3931' where customer_id in ('b7726d89-93a1-4278-9435-11aba8797b0e');

-- Xion Lamba <- Xion
update owned_vehicles set owner_id = '7a0312c9-969c-4af0-82fa-bb565feebcf2' where owner_id in ('e6d83912-4303-4ea3-97f2-a48fd364978b');
update jobs set customer_id = '7a0312c9-969c-4af0-82fa-bb565feebcf2' where customer_id in ('e6d83912-4303-4ea3-97f2-a48fd364978b');

-- Benny MacDonald <- benny, Benny, Benny Macdonald, Benny Macdonal
update owned_vehicles set owner_id = 'f240d021-9b62-4abb-8135-37f05eb8590d' where owner_id in ('7be10677-192f-43e3-ad4e-faf0c86b115f', '8efa2fe3-e2bc-4706-8717-13177987f606', 'ceef94ec-bd1e-45c9-a827-ec247ebf5c7c', 'e6f3de16-5628-4c5b-a5e3-1f88d24fdceb');
update jobs set customer_id = 'f240d021-9b62-4abb-8135-37f05eb8590d' where customer_id in ('7be10677-192f-43e3-ad4e-faf0c86b115f', '8efa2fe3-e2bc-4706-8717-13177987f606', 'ceef94ec-bd1e-45c9-a827-ec247ebf5c7c', 'e6f3de16-5628-4c5b-a5e3-1f88d24fdceb');

-- Jim Caraway <- Jim Carraway, jim, Jim
update owned_vehicles set owner_id = 'c5eadc7a-c99d-42a2-afea-604cf3e426b0' where owner_id in ('7cfbdc09-f29a-4a07-99ec-0869f20770da', 'b4594cfd-0793-430b-bf31-6b5687eda5b4', 'c080a919-7401-407b-bf62-0b2add3e7322');
update jobs set customer_id = 'c5eadc7a-c99d-42a2-afea-604cf3e426b0' where customer_id in ('7cfbdc09-f29a-4a07-99ec-0869f20770da', 'b4594cfd-0793-430b-bf31-6b5687eda5b4', 'c080a919-7401-407b-bf62-0b2add3e7322');

-- Marcus <- marcus
update owned_vehicles set owner_id = '7e1296f5-f8f7-4d8e-ba9f-4b2dc95354ab' where owner_id in ('a78f934d-2f1a-4366-b53c-75eff8fd0925');
update jobs set customer_id = '7e1296f5-f8f7-4d8e-ba9f-4b2dc95354ab' where customer_id in ('a78f934d-2f1a-4366-b53c-75eff8fd0925');

-- Percy <- percy
update owned_vehicles set owner_id = '7e26a584-3aaf-4f67-bf82-11f40b003a18' where owner_id in ('d096837f-6d4c-4935-bde4-1faff3e9cf35');
update jobs set customer_id = '7e26a584-3aaf-4f67-bf82-11f40b003a18' where customer_id in ('d096837f-6d4c-4935-bde4-1faff3e9cf35');

-- Chip Scribner <- Chip
update owned_vehicles set owner_id = '7e4d0167-684a-428e-b619-a8dd61af0308' where owner_id in ('d935a1e0-17d1-4b66-b2a5-34f363c16d82');
update jobs set customer_id = '7e4d0167-684a-428e-b619-a8dd61af0308' where customer_id in ('d935a1e0-17d1-4b66-b2a5-34f363c16d82');

-- Daniel <- daniel
update owned_vehicles set owner_id = 'be434c59-f9c5-4736-8527-4479476afb98' where owner_id in ('7fccadc7-8f8b-4dd2-ae23-ff029a1867ff');
update jobs set customer_id = 'be434c59-f9c5-4736-8527-4479476afb98' where customer_id in ('7fccadc7-8f8b-4dd2-ae23-ff029a1867ff');

-- Evan Calder <- evan, Evan
update owned_vehicles set owner_id = '9a9d87fc-9696-47f1-9cac-5276aeffdbd0' where owner_id in ('80eeed20-463c-41e0-8c5c-8cc25332850d', 'dcc3fd92-6f86-4169-9f03-874f38eab337');
update jobs set customer_id = '9a9d87fc-9696-47f1-9cac-5276aeffdbd0' where customer_id in ('80eeed20-463c-41e0-8c5c-8cc25332850d', 'dcc3fd92-6f86-4169-9f03-874f38eab337');

-- Charlie <- charlie
update owned_vehicles set owner_id = 'f4d90f54-a2c3-4be1-ab0b-8deb7b1d64b3' where owner_id in ('83c804bc-2ee1-4eb1-82af-8cb5f6f8e9b4');
update jobs set customer_id = 'f4d90f54-a2c3-4be1-ab0b-8deb7b1d64b3' where customer_id in ('83c804bc-2ee1-4eb1-82af-8cb5f6f8e9b4');

-- Mallory Johnson <- Mallory
update owned_vehicles set owner_id = '90ea577b-5cf9-4222-a86c-bca4e0818f7f' where owner_id in ('83d12eff-8314-4e95-bb65-6a2fa9d99730');
update jobs set customer_id = '90ea577b-5cf9-4222-a86c-bca4e0818f7f' where customer_id in ('83d12eff-8314-4e95-bb65-6a2fa9d99730');

-- Lucille Grace <- Lucille
update owned_vehicles set owner_id = '84094f60-379e-4b57-b807-faf7652f2128' where owner_id in ('cb5e97a7-2ac6-45c4-a427-eaecc61dad72');
update jobs set customer_id = '84094f60-379e-4b57-b807-faf7652f2128' where customer_id in ('cb5e97a7-2ac6-45c4-a427-eaecc61dad72');

-- Myles Fitzgerald <- myles, Myles
update owned_vehicles set owner_id = 'ad6f5a31-c7ad-471f-b4dd-75b66bb87464' where owner_id in ('887e985e-92a5-410c-a5f4-a2bcda045e6d', 'd2e87d3e-424c-4206-8562-40d52cf3b71f');
update jobs set customer_id = 'ad6f5a31-c7ad-471f-b4dd-75b66bb87464' where customer_id in ('887e985e-92a5-410c-a5f4-a2bcda045e6d', 'd2e87d3e-424c-4206-8562-40d52cf3b71f');

-- Jimmy <- jimmy
update owned_vehicles set owner_id = 'ad0b54bb-e10e-412e-a648-74114408f5f1' where owner_id in ('894eba4c-062e-46da-a76b-05a63cab36d0');
update jobs set customer_id = 'ad0b54bb-e10e-412e-a648-74114408f5f1' where customer_id in ('894eba4c-062e-46da-a76b-05a63cab36d0');

-- Noelle Hart <- Noelle
update owned_vehicles set owner_id = 'b3d495fa-51fc-4b37-8ec8-cf6aebc47bca' where owner_id in ('8950e4ea-9582-4b11-b0fc-9127163eb9c2');
update jobs set customer_id = 'b3d495fa-51fc-4b37-8ec8-cf6aebc47bca' where customer_id in ('8950e4ea-9582-4b11-b0fc-9127163eb9c2');

-- Nora Rhodes <- Nora
update owned_vehicles set owner_id = 'fb8c2091-4b09-4b70-99c8-d2a291381ba0' where owner_id in ('8a7aec39-fd08-46f1-a769-56f52ac223ea');
update jobs set customer_id = 'fb8c2091-4b09-4b70-99c8-d2a291381ba0' where customer_id in ('8a7aec39-fd08-46f1-a769-56f52ac223ea');

-- Riley <- riley
update owned_vehicles set owner_id = '8bc6293a-1f1a-4729-9025-8933c51cd16c' where owner_id in ('fcb77648-4c93-4308-87d7-5b7534cad9f3');
update jobs set customer_id = '8bc6293a-1f1a-4729-9025-8933c51cd16c' where customer_id in ('fcb77648-4c93-4308-87d7-5b7534cad9f3');

-- James <- james
update owned_vehicles set owner_id = 'd4dbb204-5541-4538-8fe9-e87d702d98a9' where owner_id in ('8c264c3f-d5dd-40b0-8b97-5f57806d7678');
update jobs set customer_id = 'd4dbb204-5541-4538-8fe9-e87d702d98a9' where customer_id in ('8c264c3f-d5dd-40b0-8b97-5f57806d7678');

-- John McClane <- John MCLANE
update owned_vehicles set owner_id = 'dc820ffd-0b40-44de-a1ea-95f21321c950' where owner_id in ('8c8a4028-438d-4a5e-b87a-73823d799d1e');
update jobs set customer_id = 'dc820ffd-0b40-44de-a1ea-95f21321c950' where customer_id in ('8c8a4028-438d-4a5e-b87a-73823d799d1e');

-- Desmond Doss <- Desmond
update owned_vehicles set owner_id = '8cbe35d0-bd46-46f5-8c53-bec0075beaad' where owner_id in ('f773d05b-1b74-4cd0-950a-d982a3990937');
update jobs set customer_id = '8cbe35d0-bd46-46f5-8c53-bec0075beaad' where customer_id in ('f773d05b-1b74-4cd0-950a-d982a3990937');

-- Bradley Stoker <- Bradley STOKER
update owned_vehicles set owner_id = 'e869484a-3242-4582-9472-1c2bd9bb6587' where owner_id in ('8d56e1a0-48f0-4ecb-949e-d4a71d532e48');
update jobs set customer_id = 'e869484a-3242-4582-9472-1c2bd9bb6587' where customer_id in ('8d56e1a0-48f0-4ecb-949e-d4a71d532e48');

-- Jaquan Chavis <- Jaquan
update owned_vehicles set owner_id = '8fc32267-97df-45cb-9580-e3dd8469c655' where owner_id in ('f4b0d254-edc2-474a-aca2-2213fe5df147');
update jobs set customer_id = '8fc32267-97df-45cb-9580-e3dd8469c655' where customer_id in ('f4b0d254-edc2-474a-aca2-2213fe5df147');

-- Cole Tempest <- Cole Tempst, Cole, Cole Temptest
update owned_vehicles set owner_id = '90a7873b-0cbb-4a75-a7c5-6d444bdd9b8f' where owner_id in ('adb1edbc-ffeb-4a9b-acf1-9f470f0e9c1f', 'bb9412d7-d2ae-4406-b0c8-f7777650cf02', 'c44e9da0-7ea4-414a-a701-1fd7594893a0');
update jobs set customer_id = '90a7873b-0cbb-4a75-a7c5-6d444bdd9b8f' where customer_id in ('adb1edbc-ffeb-4a9b-acf1-9f470f0e9c1f', 'bb9412d7-d2ae-4406-b0c8-f7777650cf02', 'c44e9da0-7ea4-414a-a701-1fd7594893a0');

-- Cheda McNasty <- Cheda
update owned_vehicles set owner_id = 'ef3ca67f-7ee0-45bb-a9d9-c58c32eb130c' where owner_id in ('92178a46-0451-4351-b815-89021c63d37e');
update jobs set customer_id = 'ef3ca67f-7ee0-45bb-a9d9-c58c32eb130c' where customer_id in ('92178a46-0451-4351-b815-89021c63d37e');

-- Ivar Aslanov <- ivar
update owned_vehicles set owner_id = 'ef2da1eb-b2a7-4fa5-b044-cdbffe4fb97e' where owner_id in ('9484369e-c9c6-4eb8-abb8-ab0bbbb975b5');
update jobs set customer_id = 'ef2da1eb-b2a7-4fa5-b044-cdbffe4fb97e' where customer_id in ('9484369e-c9c6-4eb8-abb8-ab0bbbb975b5');

-- Trevor Peters <- Trevor
update owned_vehicles set owner_id = 'b770bb43-ac59-4117-afeb-2d78c763b3f3' where owner_id in ('95b026d5-4515-4886-9e3d-c33c950ff2af');
update jobs set customer_id = 'b770bb43-ac59-4117-afeb-2d78c763b3f3' where customer_id in ('95b026d5-4515-4886-9e3d-c33c950ff2af');

-- Ada Sjalk <- Ada
update owned_vehicles set owner_id = '95f75f18-7554-4f97-bfd6-b62ef9c7956b' where owner_id in ('c386a6a1-d7b0-433a-83c1-51a6d9462e0e');
update jobs set customer_id = '95f75f18-7554-4f97-bfd6-b62ef9c7956b' where customer_id in ('c386a6a1-d7b0-433a-83c1-51a6d9462e0e');

-- Aurora Gravewood <- Aurora
update owned_vehicles set owner_id = 'd8775dcc-de1f-486e-a1ce-4ae25846a1ae' where owner_id in ('9732ca56-e0be-4782-9f9f-562a57f5aff4');
update jobs set customer_id = 'd8775dcc-de1f-486e-a1ce-4ae25846a1ae' where customer_id in ('9732ca56-e0be-4782-9f9f-562a57f5aff4');

-- Jace Thorne <- Jace
update owned_vehicles set owner_id = 'c68e04d5-a8ca-4da8-91d4-b2c30fb5213b' where owner_id in ('9738a589-668c-4f14-b045-adc3eb43a0e8');
update jobs set customer_id = 'c68e04d5-a8ca-4da8-91d4-b2c30fb5213b' where customer_id in ('9738a589-668c-4f14-b045-adc3eb43a0e8');

-- Coley Sloop <- Coley
update owned_vehicles set owner_id = '9b7ca065-ab49-4466-a037-3b5f23f0e524' where owner_id in ('c6ad30bd-db96-465f-9a05-a2ce8af399f4');
update jobs set customer_id = '9b7ca065-ab49-4466-a037-3b5f23f0e524' where customer_id in ('c6ad30bd-db96-465f-9a05-a2ce8af399f4');

-- Alex <- alex, aLEX
update owned_vehicles set owner_id = 'f7e2f9fa-25c6-41d1-9272-776f4852e907' where owner_id in ('9d7ebde0-b0d2-49c0-a612-9a3f46294e65', 'eb11315b-9fa0-4160-9e44-fc20363cf238');
update jobs set customer_id = 'f7e2f9fa-25c6-41d1-9272-776f4852e907' where customer_id in ('9d7ebde0-b0d2-49c0-a612-9a3f46294e65', 'eb11315b-9fa0-4160-9e44-fc20363cf238');

-- Sal Luciano <- Sal
update owned_vehicles set owner_id = '9ec2b5f4-7b33-4733-a372-008d38bd5dbf' where owner_id in ('b84e5b35-4eb6-4d2d-9073-8ee51c922200');
update jobs set customer_id = '9ec2b5f4-7b33-4733-a372-008d38bd5dbf' where customer_id in ('b84e5b35-4eb6-4d2d-9073-8ee51c922200');

-- Clay <- clay
update owned_vehicles set owner_id = 'e93b3278-4bd2-40a8-bb72-8ce7972b80a9' where owner_id in ('9fb7488f-51b2-4848-8a7b-5c7cbccd3794');
update jobs set customer_id = 'e93b3278-4bd2-40a8-bb72-8ce7972b80a9' where customer_id in ('9fb7488f-51b2-4848-8a7b-5c7cbccd3794');

-- Ohtyka Gambi <- Ohtyka
update owned_vehicles set owner_id = 'a12d005b-a7fc-4ad3-8ec8-5fab5d4e4337' where owner_id in ('e730fd02-f386-4194-9387-a5b03fe92573');
update jobs set customer_id = 'a12d005b-a7fc-4ad3-8ec8-5fab5d4e4337' where customer_id in ('e730fd02-f386-4194-9387-a5b03fe92573');

-- Franny Hicks <- Franny
update owned_vehicles set owner_id = 'e06c7e88-6bda-4951-a8ec-0984cba72336' where owner_id in ('a17ac0a2-e241-4798-8d03-8731a1332332');
update jobs set customer_id = 'e06c7e88-6bda-4951-a8ec-0984cba72336' where customer_id in ('a17ac0a2-e241-4798-8d03-8731a1332332');

-- Rico Kingston <- Rico
update owned_vehicles set owner_id = 'c1ca7f0d-e2d4-449b-9a94-48341f2bf915' where owner_id in ('a1f5e07b-7dce-45df-9556-7b712c5aa30c');
update jobs set customer_id = 'c1ca7f0d-e2d4-449b-9a94-48341f2bf915' where customer_id in ('a1f5e07b-7dce-45df-9556-7b712c5aa30c');

-- LP <- lp
update owned_vehicles set owner_id = 'a2bea0bc-85bc-4994-b4e2-9f64713b21f2' where owner_id in ('c2416c43-4fc2-437c-8f52-e121cfd377e4');
update jobs set customer_id = 'a2bea0bc-85bc-4994-b4e2-9f64713b21f2' where customer_id in ('c2416c43-4fc2-437c-8f52-e121cfd377e4');

-- Lucan DeSantos <- Lucan
update owned_vehicles set owner_id = 'cec7859f-4ba4-40d3-94fa-77e1bd2cb365' where owner_id in ('a3522220-0ab0-444b-a63d-c2fa8bedb117');
update jobs set customer_id = 'cec7859f-4ba4-40d3-94fa-77e1bd2cb365' where customer_id in ('a3522220-0ab0-444b-a63d-c2fa8bedb117');

-- Greg <- greg
update owned_vehicles set owner_id = 'f65a84d0-4f1f-4082-aa9d-ef2229c0609d' where owner_id in ('a541f93b-7efb-447c-b602-32a1d7cf6fd1');
update jobs set customer_id = 'f65a84d0-4f1f-4082-aa9d-ef2229c0609d' where customer_id in ('a541f93b-7efb-447c-b602-32a1d7cf6fd1');

-- Thomas <- thomas
update owned_vehicles set owner_id = 'aa13ac7b-c7e8-4855-8325-48aeec51f142' where owner_id in ('b1290b71-1d77-4e6a-932b-f944fa32242d');
update jobs set customer_id = 'aa13ac7b-c7e8-4855-8325-48aeec51f142' where customer_id in ('b1290b71-1d77-4e6a-932b-f944fa32242d');

-- Ray <- ray
update owned_vehicles set owner_id = 'e6cf4261-d383-4c3f-a7cb-2746ef7c2606' where owner_id in ('abde76f3-19cb-4cec-ac7b-c86e0e5ead0d');
update jobs set customer_id = 'e6cf4261-d383-4c3f-a7cb-2746ef7c2606' where customer_id in ('abde76f3-19cb-4cec-ac7b-c86e0e5ead0d');

-- Kev <- kev
update owned_vehicles set owner_id = 'aca01131-9861-4f0f-a31a-ffc60ba9a715' where owner_id in ('c821ce46-b33e-4802-964e-f8f7f39c09a4');
update jobs set customer_id = 'aca01131-9861-4f0f-a31a-ffc60ba9a715' where customer_id in ('c821ce46-b33e-4802-964e-f8f7f39c09a4');

-- Odin <- odin
update owned_vehicles set owner_id = 'bd65a8d6-122f-4c82-aaee-c4f2c236e03b' where owner_id in ('ad800892-d8ed-4a5e-b082-ab403cbce8f3');
update jobs set customer_id = 'bd65a8d6-122f-4c82-aaee-c4f2c236e03b' where customer_id in ('ad800892-d8ed-4a5e-b082-ab403cbce8f3');

-- Vikki <- vikki
update owned_vehicles set owner_id = 'e9d44544-a64d-4474-885d-f1b7d4d5c099' where owner_id in ('b0ea2aac-318e-4ec4-8678-97b812bac98d');
update jobs set customer_id = 'e9d44544-a64d-4474-885d-f1b7d4d5c099' where customer_id in ('b0ea2aac-318e-4ec4-8678-97b812bac98d');

-- Adrien Blackthorne <- Adrien Blackthorn
update owned_vehicles set owner_id = 'b17c51c4-6ea7-4b69-bb76-157e0241992d' where owner_id in ('dceec30e-e247-4043-b120-fa4e17c31a18');
update jobs set customer_id = 'b17c51c4-6ea7-4b69-bb76-157e0241992d' where customer_id in ('dceec30e-e247-4043-b120-fa4e17c31a18');

-- Tino Evaso <- Tino
update owned_vehicles set owner_id = 'b262ce51-38ce-4985-b13c-8c19a1bd08a9' where owner_id in ('b21a16c6-e19b-4881-997e-8e49323e6a6c');
update jobs set customer_id = 'b262ce51-38ce-4985-b13c-8c19a1bd08a9' where customer_id in ('b21a16c6-e19b-4881-997e-8e49323e6a6c');

-- Sabal Tillards <- Sabal
update owned_vehicles set owner_id = 'ea56383c-2cea-4b6c-9e94-836addc3faa2' where owner_id in ('b2544f4d-4795-4469-9849-2aaee35cb8dc');
update jobs set customer_id = 'ea56383c-2cea-4b6c-9e94-836addc3faa2' where customer_id in ('b2544f4d-4795-4469-9849-2aaee35cb8dc');

-- Brian Loy <- Brian, Brian LOY
update owned_vehicles set owner_id = 'e074d010-1c4c-443c-9bbe-9109327c502a' where owner_id in ('b4b610ec-74af-4570-86cc-370e8a84118c', 'e52ef40c-8568-4cbe-bf1f-7b83710699c8');
update jobs set customer_id = 'e074d010-1c4c-443c-9bbe-9109327c502a' where customer_id in ('b4b610ec-74af-4570-86cc-370e8a84118c', 'e52ef40c-8568-4cbe-bf1f-7b83710699c8');

-- Alvin Bruzz <- Alvin
update owned_vehicles set owner_id = 'bca91fb3-03d1-4d38-99fa-67d16ef0639f' where owner_id in ('e679b1d9-e191-497b-8d7c-879a3e7597e6');
update jobs set customer_id = 'bca91fb3-03d1-4d38-99fa-67d16ef0639f' where customer_id in ('e679b1d9-e191-497b-8d7c-879a3e7597e6');

-- Wesley Clark <- Wesley
update owned_vehicles set owner_id = 'e0b7a7db-b8c0-4555-8edc-ed0c19a69428' where owner_id in ('bedc4878-95a8-4972-92dc-fa2003e0d3c6');
update jobs set customer_id = 'e0b7a7db-b8c0-4555-8edc-ed0c19a69428' where customer_id in ('bedc4878-95a8-4972-92dc-fa2003e0d3c6');

-- Kade <- kADE
update owned_vehicles set owner_id = 'c1be2cfb-33b4-41f3-8291-dc9cb80b5b1a' where owner_id in ('c47f3a40-90eb-4265-955c-5378b18b0f0a');
update jobs set customer_id = 'c1be2cfb-33b4-41f3-8291-dc9cb80b5b1a' where customer_id in ('c47f3a40-90eb-4265-955c-5378b18b0f0a');

-- Kayce Carter <- Kayce
update owned_vehicles set owner_id = 'eab0cd37-732d-46c9-8d69-46a76348ac99' where owner_id in ('c3c16940-7af0-44d1-b2c8-3369b6939d9d');
update jobs set customer_id = 'eab0cd37-732d-46c9-8d69-46a76348ac99' where customer_id in ('c3c16940-7af0-44d1-b2c8-3369b6939d9d');

-- Denim Danger <- Denim
update owned_vehicles set owner_id = 'c8613a1f-1f69-4ea5-83f0-30706f7bdbb9' where owner_id in ('fa275faa-5c8b-455e-abb4-201fb54de641');
update jobs set customer_id = 'c8613a1f-1f69-4ea5-83f0-30706f7bdbb9' where customer_id in ('fa275faa-5c8b-455e-abb4-201fb54de641');

-- Hannah Crow <- Hannah
update owned_vehicles set owner_id = 'c9240f49-60ee-4026-8bc6-23a0118228c1' where owner_id in ('f38522fd-2943-4421-b223-70b4e6921e88');
update jobs set customer_id = 'c9240f49-60ee-4026-8bc6-23a0118228c1' where customer_id in ('f38522fd-2943-4421-b223-70b4e6921e88');

-- Mac Pickles <- Mac
update owned_vehicles set owner_id = 'cdc6576c-8037-4119-b75b-a847253a5259' where owner_id in ('c9b72796-2df0-448d-88f6-62d2e84c4ca8');
update jobs set customer_id = 'cdc6576c-8037-4119-b75b-a847253a5259' where customer_id in ('c9b72796-2df0-448d-88f6-62d2e84c4ca8');

-- Renazo Salvatore <- Renazo
update owned_vehicles set owner_id = 'cb8ccb5c-57ce-4a1d-b709-51119df2817e' where owner_id in ('d17bd1da-5a70-4119-9f3d-25210b93b09b');
update jobs set customer_id = 'cb8ccb5c-57ce-4a1d-b709-51119df2817e' where customer_id in ('d17bd1da-5a70-4119-9f3d-25210b93b09b');

-- Dima Shevchenko <- dIMA, Dima
update owned_vehicles set owner_id = 'd4cea260-54a1-42b6-8512-cac5ca4e6e0f' where owner_id in ('da1937a6-5ba6-4964-b2fb-c744cfaa3746', 'edc0383d-e486-447a-823e-2acb5ffe1b52');
update jobs set customer_id = 'd4cea260-54a1-42b6-8512-cac5ca4e6e0f' where customer_id in ('da1937a6-5ba6-4964-b2fb-c744cfaa3746', 'edc0383d-e486-447a-823e-2acb5ffe1b52');

-- Larry <- larry
update owned_vehicles set owner_id = 'd87e6df1-2fd8-430a-9b26-4811a6ab9e09' where owner_id in ('ed273241-bbc9-47f2-b417-0617d75f666d');
update jobs set customer_id = 'd87e6df1-2fd8-430a-9b26-4811a6ab9e09' where customer_id in ('ed273241-bbc9-47f2-b417-0617d75f666d');

-- Lily Olson <- lily, Lily OLson
update owned_vehicles set owner_id = 'fde6d4ec-9c83-4887-88c4-6ef32775dcb1' where owner_id in ('e5edec9d-c3d4-4b90-bbb8-cfbae3fa584b', 'ef3b492d-dda4-4b29-b79f-448f981b65ae');
update jobs set customer_id = 'fde6d4ec-9c83-4887-88c4-6ef32775dcb1' where customer_id in ('e5edec9d-c3d4-4b90-bbb8-cfbae3fa584b', 'ef3b492d-dda4-4b29-b79f-448f981b65ae');

-- Jo <- jo
update owned_vehicles set owner_id = 'eae319da-69ed-4ec8-955e-b476b02d37fd' where owner_id in ('f16a53e5-5e7b-480e-b3d1-de9d8d3c8d3e');
update jobs set customer_id = 'eae319da-69ed-4ec8-955e-b476b02d37fd' where customer_id in ('f16a53e5-5e7b-480e-b3d1-de9d8d3c8d3e');

-- Foster Lee <- Foster
update owned_vehicles set owner_id = 'ee6268fe-8504-4e86-bbd2-8cc2fc8de500' where owner_id in ('f2b22639-b5d0-4289-a778-9f792fed3478');
update jobs set customer_id = 'ee6268fe-8504-4e86-bbd2-8cc2fc8de500' where customer_id in ('f2b22639-b5d0-4289-a778-9f792fed3478');

-- Jamarkus Clark <- jamarkus
update owned_vehicles set owner_id = 'f037c702-8b0f-45ba-ae10-64265312b998' where owner_id in ('f01076ef-ea97-40e3-8f2f-5e08c6a0497a');
update jobs set customer_id = 'f037c702-8b0f-45ba-ae10-64265312b998' where customer_id in ('f01076ef-ea97-40e3-8f2f-5e08c6a0497a');

-- 148 bare first names with no reliable single full-name
-- match (2+ different real people share the first name, no clear leader by
-- activity) -- left unmerged rather than guessed, per your call: just remove
-- them from active search instead of risking a wrong attribution.

-- One statement retiring all 559 duplicate/unmatched rows
-- (both the merge-group duplicates above and the no-match bare names) --
-- batched since they all get the same treatment regardless of which group
-- they came from.
update customers set active = false where customer_id in ('0e3b910b-9fd6-40d1-a8fa-fbf41091780f', '10985cac-44c7-4720-a495-a6c331a0b964', '644f1f5d-7c7c-4b8e-aeb0-1e31f9e3f727', '011f04a1-5157-49e3-be5b-1071a0dddf41', '46515c57-1769-4c5d-9f37-303209c5fe04', '01fc894c-11dd-486f-baea-5fa323c20217', 'a73327cf-2d9d-4ded-b509-082d8bc312c9', '021be4af-b743-4d2f-a6ac-31e73f28e1c2', '022b205f-19e7-4d51-a217-2991c07c2b5f', '2723962c-9619-45fc-81ab-51b60ee9b508', '53784da1-b560-405c-acd3-fb6aace15ec1', 'a96da49d-e829-4b25-ad47-14fe6a5e466f', 'd7dfe6ff-0533-4056-94ae-a9752973bb2e', '708f3749-e7da-4e5c-8204-567773455bf2', '0289d21a-6966-4507-812c-a05a40bd8515', 'e9c90f08-eb64-4058-9db1-6de172641c11', '02b31d43-e0e6-4b45-ad9e-ab8d5582b879', '03088fd2-ab65-4325-a27e-5c53f1df6d59', '40ccb085-a767-4f5e-8afb-2d4d612ebf21', '04048924-7494-4b41-81e6-122b38801477', 'afdfb836-853b-46c1-8f4f-04906a7dc56f', '46ab1c05-0396-4e6e-8ccf-c399be9d0a54', 'eb5dc0d3-06f0-40ca-857d-b95f2d02a718', '04b7a1d4-8c60-4d2f-b092-7bf8888d59bc', '59d4e493-24d2-409e-95af-7a773930646d', '66e04dc1-03b1-4b5c-a27b-427821ebd9ef', 'bf55a7f5-a66b-4506-957d-2b6a3ae04e77', 'd63da249-a1ab-42c0-8ab2-1169d6547026', 'e3827941-695e-45d1-9e50-407f91d6d55a', '054428d4-69a6-402e-a84a-f01d00c7a6e4', '05457965-113b-4222-9290-33ef59c116ae', '18fb2c1a-6d1d-4c45-8ea0-591d7375f5d0', '0594edfa-753f-4ee0-bce6-a0928a61d265', '3a38d3e8-2b1f-4c94-93a2-6e1ec734618a', '6f711e7e-cf6a-4fef-b285-c89036a00222', '5ad7daea-ded1-484b-9da8-9444dfa4545e', '06e8964e-32b9-48cd-a38c-d948abf16b19', '070d8b1a-8a78-4901-aa3c-a9aab1327044', '7e0b99fd-1ec1-4bf8-b784-e37f24a6e8b1', '07d96ad6-1020-448c-8ee1-1157afd620c0', '50f30963-8f00-4ef2-b47e-cd12a5497b1e', 'afc849fe-dea5-409f-b0c8-e0a98300ce0b', '07f65b20-6c98-4458-a181-2adbec8174c4', '082e16e8-be11-4f85-a3ee-60f8fd2ee0ec', 'b543022b-3dd7-46d2-ab7b-74e03a2e745a', '37cee8d3-88be-4f29-a157-8227180b9c19', '6cb5149f-ca3a-4993-84cb-b882b85ef179', '6d353eac-7611-4336-aa27-50bd6afe9256', '1eea6eeb-4289-456b-b3e2-1aa31afd1e68', '0a59ab03-144f-4837-bd76-ff4d12dec321', '0a5f44cd-dd93-4cb2-8691-36bede0dcf05', '0af5589c-a292-42bb-a747-0f4cf313beaf', '5e03a491-cc04-4f12-9b02-5a7ba60933ce', '23c1cfba-c3c1-4fff-b387-45607dbced1a', 'af5d0dd4-2998-49ed-8487-fda7a6515a34', '0bbe9b80-3b58-4ce7-8fea-8f841208915c', '0d3a6154-fcfe-45ce-9e70-0296f5d0129c', '6269bb0f-9993-40d5-8912-13256766225d', '6e8d10d6-3dc7-4fa4-b7bb-73cb8217e6e7', 'f351e2e3-1dad-4e22-bd52-34f24633bc57', '224497fc-f015-4273-979e-d9c897e8dc00', '8bcec4dd-cfb8-4ff4-b1ec-51ecc4ce2ace', 'a4d7dc80-4a9f-47ac-b400-868b009a29f8', '0d6343cc-6360-4eb2-80df-0d26a3ddaddc', 'e5dbddda-486c-49e9-a527-7a0f80e62996', '0d63563a-ad8c-46b7-8e51-1d8bb712ce2c', '704cdfbe-56fd-452d-bb32-60831e338231', '9e03bc16-42cf-4c77-899f-0686c3a80992', 'e4aa2b4f-7a80-484b-b6d0-c40919767257', '0d813909-5351-47ea-8513-e941af690115', '36d18cdf-7e01-4d63-b16b-b033ee8c5030', '786895d5-7d4d-4583-9c63-ee36dfa5a749', '0efa34f3-b09f-4c3a-9230-8d5376e91205', '0f728d0d-f264-451b-b64d-75c6c69b976c', '5e41f7fa-cff6-456f-b92a-56eae3fe8e34', '27cf1923-0197-4ac2-8709-fc573aa79e17', '58ada170-b8e4-4376-8578-7a42268e4875', 'a6ab523d-6176-4841-8e81-df0c68e6ad1d', '10e647f6-17cd-4ecf-807d-3dedaf34b67a', '1b160ff4-6b9c-4702-bb28-7f3a4aa113c4', '10eb3f57-e587-461e-ac85-6bf74316374a', '117e4ea5-b18c-478c-97cc-5832825e3c8e', '11f29ac7-367f-48e1-8694-44b75fe3d729', '47f931fb-3828-42d5-9593-5de7d4f4ac3c', 'ed151eab-3d53-434b-887a-06876f2bcfa6', '1225f8d2-7b43-4594-a1d0-f7472f72c83d', '122c6b5d-3217-4e29-8d88-85c91c73ffc3', '12724b23-9281-456d-9024-82d3e3c99f97', 'b2da319f-cbd8-438a-bd85-38f6aecea435', '12d93f27-b80e-4aa0-8d3d-811f449beee3', '8bc008c6-ec13-4a6f-a781-38e440866090', 'a535c1a0-6ec8-4869-ae59-c001bfea0754', 'ddb0e5f7-791a-49c6-8ecf-bc4854218d6c', '12e327bb-c375-4ab8-a4ed-6896b002742b', 'b3663a23-bd0f-4fd5-bfea-0b5f53f916c2', 'f3eee0d2-6b75-4f80-ae9f-a9390251d47a', '136cc547-e1d7-4247-b772-3bef99e72fa3', '143e1d21-d72d-42f5-853d-3ba4c6477b78', '39323310-0650-4a58-be1d-cbf3355813bc', '9371a38b-3368-4375-9a75-82584c21847c', '5b05f801-e8de-4d58-9e6e-3062916edff2', 'aeac97ac-e782-457e-bea9-1f8adbc1b54a', '1ff78f44-c541-49b0-b871-627cecfae385', '315f1c91-754e-4fb0-a373-5462c8705e6e', 'af780d79-39e8-4d8d-9633-c1730f004150', '15331f86-0cdc-4401-8e1a-23287db51e40', '1555d004-2259-4332-bf8a-839f3a1bca36', '980ddf16-aa0d-4c3e-a74f-1d252909324d', '1589a49a-739d-474f-ac65-7331bb2bf373', '522985b1-9aa4-4dcf-aea8-873e2c6d622f', '40c5480d-d16a-41c0-a7bd-57614c9b67a0', '5907fa3c-5e68-49c3-b74c-b281a2bd111d', 'e4d242f1-1991-4c5b-82f1-263340ed30a2', 'b94b8a73-7b62-4339-9fb1-e43e0df32d3b', 'ce95b261-e565-45b8-9d7c-b7f843a1b264', 'fa2b7164-700f-41af-ae20-e5949830bcb9', 'fbf85f49-f60b-42cc-86ae-d09ea35cb78a', 'd449a7f8-31b9-441b-b767-b73faa045683', 'e19df322-7afb-457d-9c07-98c3b01e4d59', '1823ea4b-5ec7-4b92-8398-2eb32a626b63', '2f690393-7f3d-4ab5-adc8-5aad9b645ff6', 'a6c38ad2-6431-4618-8ed0-faec33c2b817', 'cb3e4fa8-3dd6-49a6-a5e7-c4e8bcac3263', '18987d23-665b-4304-bbac-77ded3ef23e2', '55f4a44e-28e8-474e-b925-c489862ccef8', '98ca738e-4f4a-4a6b-83e5-4e2a9fed59c9', 'a95ae374-ad72-4845-a010-544910cf5cb3', '6e6ece0a-9d64-4dad-ba5b-915cf7935d71', '468a1092-282a-40d4-a345-cdcf6dad1e34', '19abe388-dfac-4330-99f2-eafc0042c53e', '35661c6b-afa9-411c-b7fd-96b4fe101c7d', 'a6c820ae-e9ff-43dd-b085-9a59c4b57e58', '19e8a658-4e9e-4fcf-b12a-e79faf756cb1', '1aea4a13-6e4b-4354-ab5f-dde124c9afe4', '1af7f3dc-055c-4326-a2ee-0d0992032957', '580316bb-5417-42e9-8d57-ab3bf6e0c9e8', '1afc33f4-0d13-4fd2-8150-7e1bb56b5ea8', '3d81afbf-bd8a-4f48-9ce1-9beed020c92d', '1b38d274-6daa-4d63-850a-407433ce9dde', '56ad842c-c92e-42ab-9b74-e54016e0dcb1', 'd2eb823a-e538-49ba-be18-6b2f452f927a', 'edd40dfb-3798-4ee9-a703-b3cca758b9a6', '1b4851b2-3a6c-4943-a9d6-5a98bb40dffe', '1cd94951-0c77-4d3c-8c38-58df50fc3ba1', '20295a22-b213-4851-ad04-59af2b3b009c', '96754762-2ec6-42eb-830e-90dff84d2a7e', '1be1ac85-91eb-42bb-ab92-8dfbaefaf966', '9ea9549d-75d8-4b1d-92fd-a45776c3dc6a', '1beb0351-f549-4046-9edf-cf9630368ad0', '35a2ed49-78cf-4398-ade1-281de2d90a82', '4ec3936b-e986-4d76-8fa3-131b9d286bcc', 'f4852ef8-2575-48a8-9cc8-ee070d58c6ba', '1c83fa81-e3d4-4145-bc8d-181a3ddbc865', '5573bf04-989d-4a11-94f4-84fb353abe53', '73ed4bac-61f8-4f54-ba5e-66e2cdb9d701', 'eece3a3e-81ce-463b-ba82-f22d8b8e0da6', 'bdb428e7-a58a-4d4f-9c56-0bd8b7d77bce', '9e04c9b8-79ae-4691-be4d-2630d82caf13', '7ec46890-1215-481b-8284-d6d2e77702b6', '1fbe7b42-e502-4882-a1d9-836e5c75189c', 'ceac5dd6-6e29-4873-aa11-2e6bed8caf1f', '201bd3c1-3ca0-4b0c-bf4f-8c177d6c9639', '2106218b-1aad-493b-bfb3-ed29f5f388aa', 'ae513226-37c8-4e20-9daa-96270662be76', 'f0dbc474-65f5-47c6-be78-f274ad42f967', '2154ec78-d053-424c-a592-3dcba6cb402c', '2191b408-ab19-4dac-93b6-23d389a8a7ef', '2e87cfee-845a-44db-80a1-c86b2aff1c71', 'f98c3743-8019-48a7-a123-30d9813d341c', '22bf75de-c364-4c17-9d33-b1915c7d2f37', 'c8a47bce-1f23-42a2-ad3d-2c6b33b26358', '21b2e6dd-4e3e-43d9-b191-c929ecc6adec', '7a37b13a-5204-4fee-8198-0caaa9aa8fe9', 'efa5cdb2-9580-42b2-9881-2b4adfab293c', 'f401e2be-7b71-40ce-b329-430a6bba49c4', '3606ae60-ab2a-4ff8-81d7-e7a2aa8aeccb', 'a9a6f041-e796-49ba-bb68-bb558dbe75d7', '6047b842-ee3b-42da-8911-738cf4ae0c0d', 'ea03f978-f416-4ec6-8be1-36cc732aebc1', '2486d26a-a910-4e55-997e-c9bc647013c2', 'bbd63853-f847-4b4f-b5db-5d7ec0cf15e7', '49d44934-151a-452c-ac7a-3b302ad985f6', 'f540354c-35e7-416e-825b-82ab09bff00a', '7af40590-8a2d-4f47-ab6d-0847614be29f', '95965b6b-50ff-433f-aba6-22db48963391', '7f6134b5-daeb-4917-83fb-b5e7fd0de5e8', '262d36ae-d939-4567-82ec-5334482b4b15', 'd4172afc-1c9d-41d5-a5ae-1c8560c444d4', '4cc4b0bd-c712-46ad-a5f6-39aea0c6db12', '267a5bfb-152f-4c8d-a761-86f78fe1989c', '51884d73-c497-495d-9932-4c03d2f4b193', '26a7b3af-de74-4dbb-accc-bef4e987bdb3', 'c0bef179-09d3-4cf0-a85c-6e09465f1e4c', '3c62dde3-bf28-4b33-80aa-95b0dd9e34e2', '57369a09-8a1f-4999-ae13-67ca57cc8803', '5e96b27b-4ff3-412a-88f8-7bd27bffc3c6', '2941a3f5-26d2-4a08-9785-b890b7b07cb8', '763b1143-1480-44be-9c55-5d55ddee5b87', 'aec189cc-f831-4751-b465-f79560683f50', 'b9f11042-5bd3-4fee-8abc-4df863509b02');
update customers set active = false where customer_id in ('fac03631-eea2-4d5c-890c-c85d152faabe', '2a1db84e-c39f-48bb-a564-990fa8f60c6a', '39a56297-0cf2-4434-9c8b-681ae5ed237a', '3aca4053-77a1-4f10-b4a4-23c2059a8bef', '4c22865a-d746-4dd9-9a49-26b694245511', '7026d16a-9501-40b6-9d56-9c54cd7755c8', 'cda03aa9-dd53-40c0-982e-3edfce843154', '2a69f276-989b-4487-8cda-d41d5176a59d', '541e23e9-3d0a-4972-9e34-4a04223cb9ae', '2c5648f1-d4bc-4157-87a6-abdbfc8ec8da', '2db59ef1-671c-4866-8426-69b1f26ac096', 'ab9298ed-580a-4c89-8005-f96106a5fe04', 'fc5bd23e-5ba7-4524-a960-29125845f080', '2de2018d-ca06-48c7-be2d-40a0c90564c4', '3a2b81e7-282b-4467-9b9c-10c96ab122a1', '80600097-79e3-4869-9f50-e3860eed5d8d', 'cf2111f4-7ee4-4117-985c-97b9ac241b3e', 'd9bb01bd-0aa9-4bc6-af43-6a4c9287ed10', '3371d83e-3737-4ceb-8c8c-4679ec013be3', '2e472f3e-85ee-4ad9-a7d7-1c3c4fd20d06', 'd1886be6-8697-4364-94d5-9feac9dfcf42', '30abaf5d-aea9-4c3b-89ff-7dcb00d446a8', 'fd449086-a848-4a26-9227-04c46368e10b', '30b7ee92-9846-441d-9fec-262a1d005c1f', '4c904474-ecab-4716-8670-93ed9d35a767', '30f59528-263d-4263-b165-36b44a61d4e1', '5313831d-dba5-4cdd-95af-22e0648ed8b3', 'c9a0f622-8773-4402-a907-4fdffb67b31a', '327b38b0-4332-42d5-8e52-0c87afd53fc0', '6dbe802b-a460-4917-829d-6342fb18a769', '34624f72-bf24-4c83-92e1-7a3a2efafdd3', '7c5b4f04-8c78-44a9-8570-19fddaa92084', '74cbfb09-0b34-44ee-aecd-ff103b4bf2b4', '46585cb4-545b-4fbc-bc75-214dd69d1440', 'e4faa1b9-2c21-4e87-a5d2-995a5f2b9f7d', '359f815c-366d-4f0c-b4d5-8573ac6b9aed', '50adfc69-66e7-452b-81da-87f77fe2f53a', '837fe4e4-49d2-465a-8a8f-b22a673df7db', '9ff01cc9-39b2-4dc8-8534-42a042df4263', '35af344a-c680-47f9-ab4e-ba1cbd078890', '3649c474-3656-423f-8f94-a91e4af3a8e5', '368b48ba-2fc2-4fe7-b2ca-643f21b31506', '90a737c7-5a0e-45ea-992c-93e0587aa2eb', '8bb8778d-bc45-420a-8357-867443155083', '36dcfd3e-080b-4ff6-b460-a8895d91bcef', '56f623ef-a5a9-4e23-960d-2ee83b9d44ad', '38c0679a-3038-4a92-9baa-abc5abe7334a', '7dea9b4d-7e71-431e-b560-05eac11a1d05', '9a517614-27ce-4cbe-b12c-3cb80b71e41a', 'cb5d3432-b097-4f12-8334-25fcd6d55dd5', 'c7d39cd5-c4b0-4c29-9107-969bdb409a98', 'dbc7c44e-2615-4fd2-8568-83b30584e1c8', '963b98f6-6008-41df-a9a9-18dc7dcd8b6a', '3b5c84f5-df23-426a-b6dd-fa2cf9b3f184', '76c2a0be-6918-4912-915f-56ee71d2bdac', '3ccc2a27-136b-4387-9bb3-840206a75234', '76a6b156-f487-41e8-ac58-384610684bf4', 'f1eb80dd-345a-44a7-9544-e1748eaf23ce', '3f350d17-425c-4448-8d3c-c19e0fe66a5e', '3e41e164-1aa8-457b-81fe-5ef37882c755', '6ee04795-c697-493f-b940-065a2c20c996', '3ef9c00c-70ed-44fa-a675-bb914f90173f', '3fe948f5-dddb-4961-9803-7e07308b01de', '4678a885-dbcf-4621-8aec-29c999bb26f4', '68cde908-d156-4a5a-959f-ff8ca9d91e9c', 'f39db42f-7e0a-447a-a7de-1007a8a2021d', '4018d704-08dd-40c3-a0b4-596f6e7f4ff7', '404293b5-4919-4f32-a8ee-ff884543406a', '4075a17d-101d-4c19-b977-63ff16ef2114', '851ebb4b-e807-4c3e-bdbc-f95318b24abc', 'f572013a-d497-4473-a468-757453c03dbd', 'f7dd3570-7583-438a-8c4d-2a435b29b480', '418807bf-8cea-4122-bae9-fc99bc360302', 'a31af50a-f1e8-4837-8b0d-c75484e22132', '41dd9ed4-a7b9-4d42-a87b-2659fb4b7813', '82589670-a49f-44ea-b305-7239caa79234', 'fadd3c4a-ccb1-4646-9be5-f57685afaa14', '4282dc22-36d7-4a68-90cd-9caa96a2de5d', 'd1ebb722-c35a-450e-ac9e-bc90556dbb1c', '6bd39921-d03c-46b3-ae47-b094e12e49f5', '42becc63-a059-46cc-998f-462b3423f5df', 'b316ddee-7ad4-48db-9bd9-3aad89811d7a', '42f201d4-4012-4ee7-856c-470d350d71db', 'd5ad0095-b2e0-4c55-af30-9c8c789d38e4', 'aed3657b-b541-45d9-83a6-6c2c9805ba96', 'ab28f4a3-53e5-49e4-b91b-48defeb79001', '9064e734-9149-4e0b-81ec-8df2d7b81958', '46c5ed14-450e-43fc-905e-0bed6ad0de9d', 'ded78b8e-1c86-48a3-8924-8820b804f777', '83277404-7582-4ea6-9745-0da548281089', '47d82c40-c824-4029-8694-203d9618bfdd', '4804d178-cd8b-4e94-be42-551ca6314a87', '49a40c77-7332-43a5-a556-b588dc1524d7', '703d1ade-b54f-437c-a595-fae9ac999470', '4acae278-9b40-4d9b-a57d-35b79dbbf8a8', 'ff446cd0-535d-43a1-9dfd-fda7169a37a2', '96b0ca5c-8ab8-4597-9899-c1359f017318', '4b5eb153-4f44-4d99-91c4-9803018bdd18', '4b6552c7-0fb0-4ee0-abf8-1108bc44504a', 'a3e6a352-ab7a-4960-aa06-c1223d8f901f', '4eabe73a-646f-4848-9564-b7ecc1fad6cd', 'e2227aeb-2970-4acc-86f5-253c87da7094', '4ee5a7ae-668b-42b3-b6b8-787fe0db56e7', '6f8b76f8-d1d3-4635-a26b-f33ef77d30f7', 'f70cf04a-b55c-4c16-bac5-bcbdb8d31596', 'c187fd53-091a-40cf-8a5a-2c48faead386', 'cf422e9b-ec09-48cb-8e85-17e19653a435', '4f2e6334-3b2c-4177-9ef6-91a9cdfbd00b', '911db222-ef8b-4901-a45f-b9697062cdb2', '5058fcab-8f6c-4230-9d58-ffbafb5248dd', '96f771f9-8c39-4ba6-97dd-cea83e57c504', '5065d55d-5c5b-439b-892a-328b1c455ce2', 'b5f81b55-d253-4eca-9763-57ba1ee94fb1', '520810c3-8a5b-4064-b346-2e64fd36d61b', '90691f57-e582-4f9d-8abf-27021909441b', '6132605a-c35d-4817-89f0-82dfe452ab59', '64e7b7e3-655c-4f69-8ed0-afc71d25d54d', '80ce9ef4-d7bf-48e6-a210-d2288394d3ae', '8b1716d9-962e-4960-a604-574e7dc45058', 'caed4896-4ffd-4c72-b4ac-62b214be3a8e', '52888386-860e-4fde-b594-40ca3bf410c2', 'f2584659-1d76-412e-b843-239a0a2fa7f3', '536fc775-a3bb-4b33-a7c2-563ded2d7ea6', '53d89ca4-1bf6-47ef-a4b6-53d960a47fc9', '53edf996-6a80-4423-81ed-69af69a1da6b', 'ed28b70f-240e-45dd-83b6-c05eff7e3e32', '53ff7ad8-1f4f-4333-afa6-9ffe6d1d1097', '543c164c-7db2-4c6f-98a8-5f3624d89e50', 'a7c26507-8110-4005-b224-99b06228cc3a', '6ebf8a56-e20e-4d7b-b3dd-3cfab7f038ca', '7fb488fe-f29c-4ed1-84ce-e204c1a43e16', '557156ba-fdb9-437b-a82e-d85aadb18db8', 'ae676e70-8896-4078-ab34-7f19bae572d9', '55c51a1a-5397-409a-b2d7-642c3dffa7ba', '7b49bce7-ec7b-49fc-bdc4-f732bb9ca168', 'f58034b5-1217-44bf-8b42-5f78a61ac53d', '566f6815-0671-4256-b1d8-9a6f373aa8f6', '7490d706-73da-4852-8614-5fdab4672e98', 'b75df961-cbdf-4893-9ba4-880f6ec1bfe3', 'd5cbff86-8939-4000-9997-103d832ae394', 'fa64fa33-5271-488e-ada2-182af00a351e', '59e11f3c-2bf6-49b3-a5a9-3f57a3d297a0', 'bb462bc5-97cd-44ba-9195-7070f740582f', '5bb44635-299d-4e8f-aafe-93537649ff97', '5c2e2841-f4b3-4846-9cd8-9d1cf74a0208', '810795c1-4d1a-4426-bf1a-5dffe628cc00', 'dedba3d9-8646-47ab-af79-9df8d80a0796', '5c325528-dc26-4af5-88ab-86edc1bd81e7', '83c5a0b1-af4f-4d7b-94ab-f8426f1fe669', 'd78c0f34-d6b4-4483-9ce5-3e671b756c0e', '5e8c5590-9cb3-4061-a316-92a02f8178a7', '83759f0e-33dd-4931-b7fc-90d3834337cb', '6115f2bc-0c0c-41b0-83d9-8bba60ae6097', '94780de4-78c9-46dc-bc2f-3ba325a89e36', '629476a0-ccd4-4dc1-84c5-a76d512b2e88', '62a9d7a4-922d-4a2c-b650-f571ac38b77b', '9fe73a3a-394d-4c5b-b35b-dd73b4198eae', 'eb47a8d3-d2b0-47d8-af5c-09fa9e475c9d', 'b53b70be-13a4-4c5c-9a73-dff90f5c164a', 'bf1fb23e-708e-4bf9-a1a0-2b476ab04ccd', '649170db-b2bb-430d-bb72-6998b1ffedee', 'bdc22041-940e-47c6-a141-10ff280f66d0', '678d6f09-aa09-4fa7-b31f-d96bdfd84e11', 'e1769466-e56a-41fc-b5d5-e199267c67e3', 'a3ea0fbc-9d1d-4871-a3cf-67acca98179d', '673f7ae1-48b9-4eed-acef-c70b9d62c0d8', '6b2b0581-ddcc-44a4-8d97-ce6d1ab82381', '6749e88b-bf40-488b-9cff-eac2e26db27a', '67f31f51-d5db-43d8-8903-0c1ca651163d', '691de85b-a121-401a-8cd7-bb622d8d685a', '69b0c867-4efd-4a86-bc28-f5b82ee353e7', '6a1f0eaa-8194-4dac-a8d3-2286d34817df', '930485f3-0dc6-45f6-b448-427cb6cdf4ff', 'a5c845cc-6ed4-46cb-8c15-459af9ecd2c8', 'de5547f7-fabf-4284-8a85-e6a2dfa9a8c3', 'f193c29e-dbab-4e6f-bbc3-aa9d0b1003c8', 'b9d645db-b672-46ee-8965-26080062ec56', '6cc10f8b-18d7-4ca9-819f-be12f57523b1', '6f0b048a-edd2-4b1b-8f04-c87f983c1299', '6f6f412b-d874-4f1a-9f5e-d6039fcc53a5', 'd63ae18d-f03c-4a1e-b295-dd893e74b627', '713ce8ce-3aff-4e32-99e9-d2393464fc66', '897dd6ef-cfbf-41f1-9485-21e76fd95031', '71a0b759-3404-4297-b9e5-11c423219fab', '90b09af6-69d8-4c29-8c32-d34a578a9c72', '74d6e6c7-9622-4aa3-aba9-81066e25e519', '8aaea649-4702-42ae-8835-d17261f74f56', '9452b24d-6bb3-4536-96f2-c8499adef99a', 'bf02b0c9-3734-45b4-95b5-e6db8d93dd0c', '7566c0a4-4eaa-40d1-bbcf-73164303185f', '7c200922-d5cf-4d6a-bbf7-ea39ba81c88b', 'b3efcdd4-145e-43f8-90ce-f80c85f14583', '78f16ffd-679a-4b81-aac2-73566010a3ad', 'b7726d89-93a1-4278-9435-11aba8797b0e', 'e6d83912-4303-4ea3-97f2-a48fd364978b', '7be10677-192f-43e3-ad4e-faf0c86b115f', '8efa2fe3-e2bc-4706-8717-13177987f606', 'ceef94ec-bd1e-45c9-a827-ec247ebf5c7c', 'e6f3de16-5628-4c5b-a5e3-1f88d24fdceb', '7cfbdc09-f29a-4a07-99ec-0869f20770da');
update customers set active = false where customer_id in ('b4594cfd-0793-430b-bf31-6b5687eda5b4', 'c080a919-7401-407b-bf62-0b2add3e7322', 'a78f934d-2f1a-4366-b53c-75eff8fd0925', 'd096837f-6d4c-4935-bde4-1faff3e9cf35', 'd935a1e0-17d1-4b66-b2a5-34f363c16d82', '7fccadc7-8f8b-4dd2-ae23-ff029a1867ff', '80eeed20-463c-41e0-8c5c-8cc25332850d', 'dcc3fd92-6f86-4169-9f03-874f38eab337', '83c804bc-2ee1-4eb1-82af-8cb5f6f8e9b4', '83d12eff-8314-4e95-bb65-6a2fa9d99730', 'cb5e97a7-2ac6-45c4-a427-eaecc61dad72', '887e985e-92a5-410c-a5f4-a2bcda045e6d', 'd2e87d3e-424c-4206-8562-40d52cf3b71f', '894eba4c-062e-46da-a76b-05a63cab36d0', '8950e4ea-9582-4b11-b0fc-9127163eb9c2', '8a7aec39-fd08-46f1-a769-56f52ac223ea', 'fcb77648-4c93-4308-87d7-5b7534cad9f3', '8c264c3f-d5dd-40b0-8b97-5f57806d7678', '8c8a4028-438d-4a5e-b87a-73823d799d1e', 'f773d05b-1b74-4cd0-950a-d982a3990937', '8d56e1a0-48f0-4ecb-949e-d4a71d532e48', 'f4b0d254-edc2-474a-aca2-2213fe5df147', 'adb1edbc-ffeb-4a9b-acf1-9f470f0e9c1f', 'bb9412d7-d2ae-4406-b0c8-f7777650cf02', 'c44e9da0-7ea4-414a-a701-1fd7594893a0', '92178a46-0451-4351-b815-89021c63d37e', '9484369e-c9c6-4eb8-abb8-ab0bbbb975b5', '95b026d5-4515-4886-9e3d-c33c950ff2af', 'c386a6a1-d7b0-433a-83c1-51a6d9462e0e', '9732ca56-e0be-4782-9f9f-562a57f5aff4', '9738a589-668c-4f14-b045-adc3eb43a0e8', 'c6ad30bd-db96-465f-9a05-a2ce8af399f4', '9d7ebde0-b0d2-49c0-a612-9a3f46294e65', 'eb11315b-9fa0-4160-9e44-fc20363cf238', 'b84e5b35-4eb6-4d2d-9073-8ee51c922200', '9fb7488f-51b2-4848-8a7b-5c7cbccd3794', 'e730fd02-f386-4194-9387-a5b03fe92573', 'a17ac0a2-e241-4798-8d03-8731a1332332', 'a1f5e07b-7dce-45df-9556-7b712c5aa30c', 'c2416c43-4fc2-437c-8f52-e121cfd377e4', 'a3522220-0ab0-444b-a63d-c2fa8bedb117', 'a541f93b-7efb-447c-b602-32a1d7cf6fd1', 'b1290b71-1d77-4e6a-932b-f944fa32242d', 'abde76f3-19cb-4cec-ac7b-c86e0e5ead0d', 'c821ce46-b33e-4802-964e-f8f7f39c09a4', 'ad800892-d8ed-4a5e-b082-ab403cbce8f3', 'b0ea2aac-318e-4ec4-8678-97b812bac98d', 'dceec30e-e247-4043-b120-fa4e17c31a18', 'b21a16c6-e19b-4881-997e-8e49323e6a6c', 'b2544f4d-4795-4469-9849-2aaee35cb8dc', 'b4b610ec-74af-4570-86cc-370e8a84118c', 'e52ef40c-8568-4cbe-bf1f-7b83710699c8', 'e679b1d9-e191-497b-8d7c-879a3e7597e6', 'bedc4878-95a8-4972-92dc-fa2003e0d3c6', 'c47f3a40-90eb-4265-955c-5378b18b0f0a', 'c3c16940-7af0-44d1-b2c8-3369b6939d9d', 'fa275faa-5c8b-455e-abb4-201fb54de641', 'f38522fd-2943-4421-b223-70b4e6921e88', 'c9b72796-2df0-448d-88f6-62d2e84c4ca8', 'd17bd1da-5a70-4119-9f3d-25210b93b09b', 'da1937a6-5ba6-4964-b2fb-c744cfaa3746', 'edc0383d-e486-447a-823e-2acb5ffe1b52', 'ed273241-bbc9-47f2-b417-0617d75f666d', 'e5edec9d-c3d4-4b90-bbb8-cfbae3fa584b', 'ef3b492d-dda4-4b29-b79f-448f981b65ae', 'f16a53e5-5e7b-480e-b3d1-de9d8d3c8d3e', 'f2b22639-b5d0-4289-a778-9f792fed3478', 'f01076ef-ea97-40e3-8f2f-5e08c6a0497a', 'd552a7e1-eba2-437d-a216-de6936e6a451', '105fbecb-a2d6-4354-a81a-d3ed6f2aec2a', '31e3ff10-30db-4740-a0e2-0dc61ff189a0', '6f4e3f5f-676e-4dda-a3bf-31dd0dbd38e7', '05bb3d79-5d37-41d3-b375-568ed61442dc', '7cf24f3a-0ee3-481c-a31f-5be10ca453eb', '0d7618e0-b295-4c1c-b613-fa892e3d43e5', '0d80e4f1-2e6f-4f0f-b70a-9bd12960e4e9', '0ec0544b-386b-4bd6-a082-5b435905f59c', '8a801bc1-0fd9-40c8-89b1-9b1de751dbe1', '7139b114-2c58-4ff4-9558-8d5410893f89', '13ec4185-fb0f-4026-97ad-67e3279b9ca1', '16ed5b4b-6db4-4de8-a7dd-d5030c862233', '61ad6689-2f63-4877-8d5c-eab54d682e9c', 'aa782ff5-27cf-47ca-9d44-8bc330befdd9', '834f8c78-9568-4d82-9a25-5204987e831c', '1e105b9a-8ad8-4933-8083-0b6790846cf2', '1e4e77a0-5742-444c-a4b2-d139398ae5fd', 'cfe9e218-7199-4d52-a130-f8087d51f3d7', '21a5586f-4c90-48ca-8c55-b39f65011962', '6b4fac63-7ff6-4360-a8a5-9c94cc0d50db', '26257994-19ed-45a9-8555-ed84a1cef685', '3027f4cf-c297-41bb-9243-4b07c17f17f7', '315e8bf2-5c72-4f8a-87af-166ec7aa0138', '4022ec37-adfb-436b-9a31-452ce2f875d2', '360b4f42-b47f-4ce0-8bc7-afb249f520c1', '364e65c2-eddf-4d73-8c19-189309df7a86', '37dcd2b3-1725-4375-b1ad-458b30d7aa5c', '39a636d0-f5ff-403b-a390-91bb5fb61596', '3ef0b239-6c3b-4295-a11e-d22b07209176', '3fda95db-6f66-46af-a46e-9bf2c6a2187f', '404b972d-12a0-497e-865f-e501aae86e76', 'ed526a29-fbc2-4ece-abf3-2c28dd218206', '42889128-815d-475b-830e-69bee14b1de4', '436d252f-51e0-4795-8cd4-90eaef1dc22e', '46e99dc3-d253-4cee-8972-01c4905b3198', '4ef786b5-6873-4371-b4d3-44cf344d7e47', '4f0ce297-785b-4c9d-a49a-88f253d6eee2', '4f176ae1-e8d5-46a8-bf59-877bcf4e7a81', '507c61c5-8549-427a-8412-bf9d1a5270bd', '55caaa28-c7ca-486f-b03e-1423375f6db9', '5dfc9085-3f54-4a28-863d-4f09492337fa', '6067f26c-961e-4871-a654-d386db03d965', '63b1e829-d219-4b54-b768-5a8bfe4b870d', '644e491d-eb4e-46f9-be8b-0b739896849c', '6c9c875d-e192-4369-ab90-8c446c9b315a', 'ece1c71b-514f-4c9b-bd49-25b9aad4d7ed', '6d9b0c03-3de5-4014-83c2-c457ac34d30c', '9d0ca341-5908-490a-b956-5d994b8ec2c1', '73686fdc-fa64-4b96-b3e6-dfa944bfb340', 'c94a919b-0ffd-4d24-b9f3-335988e7e72f', '75c32bcd-8105-4773-8352-f5efba66bcfa', '76a60149-6fd4-4be8-96eb-d4ab8e6a8698', '76bf3376-37c6-46f8-8456-d04876699ae9', '771dd2b5-4b96-45c5-8959-42ffeddfe15f', '7bc8dc3d-68ee-4f24-9f6f-8c20a2a89cf1', '7e1296f5-f8f7-4d8e-ba9f-4b2dc95354ab', 'be434c59-f9c5-4736-8527-4479476afb98', 'f4d90f54-a2c3-4be1-ab0b-8deb7b1d64b3', '86f1d6cc-1064-4564-a6b3-db064e6e009e', 'ad0b54bb-e10e-412e-a648-74114408f5f1', '8a6cb08f-3b6d-41b6-bc66-e86d0921ffc7', '8bc6293a-1f1a-4729-9025-8933c51cd16c', 'd4dbb204-5541-4538-8fe9-e87d702d98a9', '8f365d43-74a6-4564-bcf6-c14f14933d79', '92868f33-5cb8-46cb-bc58-2496c01acf1a', '9410edb2-452a-4f58-9982-ae454dbcd810', '945df073-691b-4637-9a05-a6ad48b7cdc6', '966fb05b-fcdd-4257-82c4-3b257f32afb1', '97246fef-91b5-4955-a669-e921bc2c3bc0', 'f7e2f9fa-25c6-41d1-9272-776f4852e907', 'e93b3278-4bd2-40a8-bb72-8ce7972b80a9', 'a243dd69-d3f1-43b0-9e2f-6a0432103438', 'f65a84d0-4f1f-4082-aa9d-ef2229c0609d', 'aa13ac7b-c7e8-4855-8325-48aeec51f142', 'e6cf4261-d383-4c3f-a7cb-2746ef7c2606', 'bd65a8d6-122f-4c82-aaee-c4f2c236e03b', 'b1fca736-647c-44ee-b5ab-1650af4d8469', 'b43b92a0-55bd-4c1b-b81e-6b0e1c224b62', 'b4cbfddc-5a0d-4e7f-bcfa-037c77373ee0', 'b693bac7-5436-484c-a85e-7f0c57c35fea', 'bd9e9c78-beb1-4cc3-97f0-4a9ca38abcd8', 'bea2e337-400f-46c9-a0f6-c13a14516ce3', 'd68dcf3e-45d5-4b38-a2d1-a2da4b2b5d1d', 'd6a0c42e-9fce-4869-9d63-aaa71c7916ae', 'd87e6df1-2fd8-430a-9b26-4811a6ab9e09', 'df162175-235c-4bb5-a88c-9906fa8fb290', 'e25bcfdc-4dfc-4b45-85d3-8ea36042a978', 'e959ab79-f068-46ae-a6c8-6056ce68bc03', 'f41ac3d0-73bd-4c05-bed0-f88a6055b0ed', 'f7973915-b244-4d3d-a7a6-fa7033d4dd0c');
