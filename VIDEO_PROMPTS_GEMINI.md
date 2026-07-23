# Road Trip Arcade Video Prompt Pack

These prompts are designed for short Gemini image-to-video generations using the existing character and vehicle reference images. The main goal is spatial continuity: one location, one camera, one simple action, and no unexplained seat changes.

## Production Method

1. Generate one clip at a time. Do not ask for a montage.
2. Attach only the character references visible in that clip, plus the blue minivan reference when needed.
3. If Gemini accepts a starting-frame reference, use a still showing the final seat layout. Animate that still instead of asking the model to construct and populate the car during the clip.
4. Keep spoken dialogue out of the generated video. Add narration, music, and sound effects afterward so lip movement cannot drift.
5. Favor a locked camera or one very slow push-in. Do not request pans that pass through doors, windows, seats, or characters.

## Continuity Lock

Paste this block at the end of every in-car prompt:

> CONTINUITY IS THE HIGHEST PRIORITY. The minivan has three clearly separated rows for the entire shot. Dad remains seated in the front-left driver seat with his seat belt fastened. Mom remains seated in the front-right passenger seat with her seat belt fastened. The son remains in the second-row left captain's chair. The daughter remains in the second-row right captain's chair. The golden retriever remains centered on the third-row bench. Every person has exactly one body, one head, two arms, and two hands. No character changes seats, crosses through a seat, passes through a door, duplicates, disappears, changes clothing, or changes age. The steering wheel remains in front of Dad only. Keep the same minivan interior, seat count, window positions, and direction of travel from first frame to last frame. One continuous shot with no cuts, no angle changes, no time jump, no morphing, and no camera crossing through the vehicle. No dialogue, lip-sync, captions, logos, watermark, or readable text.

For exterior clips, replace the seat paragraph with:

> CONTINUITY IS THE HIGHEST PRIORITY. Every family member remains in the stated position for the entire shot. Nobody enters or exits the vehicle. No character duplicates, disappears, changes clothing, changes age, passes through the vehicle, or switches sides. The blue early-1990s minivan keeps the same shape, doors, wheels, windows, blue paint, and faux-wood side paneling from first frame to last frame. One continuous shot with no cuts, no angle changes, no time jump, and no morphing. No dialogue, lip-sync, captions, logos, watermark, or readable text.

## Replacement Videos

### 1. Road Trip Arcade Introduction

Use a calm departure rather than showing everyone enter the car. Entry choreography gives the model too many opportunities to teleport people.

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. Show the family's blue early-1990s minivan with faux-wood side paneling already packed and ready in a sunny suburban driveway. Use one locked exterior three-quarter view from the front passenger side. The family is already correctly seated inside before the shot begins: Dad driving, Mom in the front passenger seat, both children in separate second-row captain's chairs, and the golden retriever on the third-row bench. Through the windows, the family gives one cheerful wave. Dad gently starts the minivan, it rolls forward out of the driveway, and the dog happily lifts its head as they begin the trip. The camera makes only a very slow push forward and never changes angle. Keep the entire minivan visible and preserve the same occupants in the same windows throughout. End with the van moving slowly down the neighborhood street. Important action remains centered for a phone screen. 720 by 1280, 24 fps.

Add the exterior version of the Continuity Lock.

### 2. Window Dash Introduction

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. The minivan is moving steadily along a sunny highway. Use one fixed over-the-shoulder camera located in the center aisle, aimed only at the son seated and buckled in the second-row left captain's chair and the large closed side window beside him. The son is bored for the first two seconds. He then notices a tiny imaginary runner outside the glass, running alongside the minivan at a constant scale. The imaginary runner stays completely outside the vehicle and performs one clean jump over a single roadside mailbox, lands safely, and continues running. The son smiles and lightly traces the jump path on the inside of the closed window with one finger. The son never leaves his seat, and the imaginary runner never becomes the son or enters the car. Green roadside scenery flows smoothly right-to-left outside. One continuous shot, one jump, no cuts, no city change, and no camera angle change. Keep the boy, window, runner, and obstacle centered. 720 by 1280, 24 fps.

Add the in-car Continuity Lock. Mom, Dad, the daughter, and dog may remain softly visible in their assigned positions, but they perform no action.

### 3. Snack Stack Introduction

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. The minivan is moving steadily through green countryside. Use one fixed camera mounted near the center of the dashboard facing backward so the two separate second-row captain's chairs and the third-row bench are clearly visible. The son remains buckled in the left captain's chair, the daughter remains buckled in the right captain's chair, and the golden retriever remains on the third-row bench. A canvas road-trip snack bag is already resting on the floor between the children's seats when the shot begins. The son lifts one bag of chips from it while the daughter lifts one granola bar. They compare the snacks, trade them once with a simple hand-to-hand exchange, and smile because each now has the snack they wanted. The dog leans forward curiously but stays in the third row. Mom is only partially visible in the front passenger seat and does not move into the back. One continuous shot, no cuts, no seat changes, and no floating food. Keep every snack the same shape while it moves. 720 by 1280, 24 fps.

Add the in-car Continuity Lock.

### 4. Wheel Jam Introduction

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. The minivan travels smoothly on a straight open highway in daylight. Use one fixed camera attached near the front passenger-side dashboard, aimed diagonally at Dad in the front-left driver seat. Dad remains buckled, keeps his eyes mostly on the road, and keeps his left hand steadily controlling the steering wheel. With the fingertips of his right hand, he taps a simple three-beat rhythm on three fixed spots along the lower half of the steering wheel, then returns his right hand to the wheel. Mom remains buckled in the front-right passenger seat and smiles toward Dad without touching the wheel. The son and daughter are clearly visible behind them in two separate second-row captain's chairs, gently nodding to the beat. The golden retriever remains visible on the third-row bench. The road and lane markings move smoothly through the windshield. No one crowds into the front row. One continuous shot, no cuts, no angle change, no sudden steering, and no dancing that moves anyone out of a seat. 720 by 1280, 24 fps.

Add the in-car Continuity Lock.

## New Game Videos

### 5. Plate Parade Introduction

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. The minivan moves steadily along a bright American highway. Use one fixed camera inside the minivan, positioned just behind the front seats and aimed toward the two separate second-row captain's chairs and the left side window. The son remains buckled in the second-row left chair and watches a red station wagon pass outside his closed window. The passing car remains fully outside, moves smoothly from behind to slightly ahead, and has one colorful license plate centered on its rear bumper. The son points once at the plate. The daughter remains buckled in the second-row right chair, looks where he points, and places one matching plate-shaped sticker into a small scrapbook already open on her lap. The golden retriever watches from the third-row bench. Use one passing car, one plate, and one sticker only. The plate stays attached to the car and never floats. One continuous shot with no cuts or camera change. 720 by 1280, 24 fps.

Add the in-car Continuity Lock.

### 6. Pack the Car Introduction

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. The family's blue early-1990s minivan is parked in a sunny driveway with its rear hatch already open. Use one fixed camera directly behind the vehicle, high enough to see the rectangular cargo floor clearly. Dad stands on the left side of the hatch, Mom stands on the right, the son stands behind Dad, the daughter stands behind Mom, and the golden retriever sits on the driveway beside the daughter. These positions never change. The cargo area begins with three clearly empty rectangular spaces. Dad places one square cooler into the left space. Mom places one long duffel bag into the right space. The children together slide one small box into the remaining center space. Each item remains solid, keeps the same size and color, fits without overlap, and stays where it is placed. End with the filled cargo floor and the family giving one satisfied nod. One continuous locked shot, no cuts, no item morphing, no floating luggage, and no hatch movement. 720 by 1280, 24 fps.

Add the exterior Continuity Lock.

## Optional Progression Videos

### Gas Station

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. At a charming old roadside gas station in daylight, the blue early-1990s minivan is parked beside one fuel pump. Use one fixed camera from the front corner of the vehicle. Dad stands beside the fuel pump with one hand resting on the pump handle. Mom stands at the hood with one large paper map already unfolded flat. The son stands to Mom's left, the daughter stands to her right, and the golden retriever sits beside the daughter. Mom traces one route across the map with her finger. The children lean closer, then all four people look toward the same open highway in the distance. Nobody walks, changes sides, enters the minivan, or handles a second object. No readable writing on the pump or map. One continuous shot. 720 by 1280, 24 fps.

Add the exterior Continuity Lock.

### Dealership Unlock

> Create an exactly 10-second vertical 9:16 video in the warm, polished 3D animated family-film style of the attached references. On a cheerful small-town car lot in late-afternoon light, show the family standing in a fixed semicircle around one newly earned road-trip vehicle. Use one slow, steady camera push from the front corner of the new vehicle. Dad stands at the driver-side front fender holding one set of keys. Mom stands at the passenger-side front fender. The son and daughter stand together near the closed rear passenger door, and the golden retriever sits between them. Dad lifts the keys once. The headlights blink once, and the family reacts with proud smiles. Nobody enters the vehicle, no doors open, and no salesperson appears. Keep the new vehicle's body shape, paint, doors, wheels, and windows identical for the whole shot. One continuous shot with no cuts or morphing. 720 by 1280, 24 fps.

Add the exterior Continuity Lock.

## Negative Prompt Add-On

If Gemini provides a separate negative-prompt field, use:

> cuts, montage, shot change, camera teleport, camera passing through glass, camera passing through seats, seat swapping, wrong driver, steering wheel on passenger side, missing row, merged seats, extra bench, extra passenger, duplicate character, disappearing character, character morphing, age change, clothing change, face change, extra limb, fused hand, floating object, object changing shape, open moving door, person passing through door, unsafe standing passenger, unreadable text, subtitles, logo, watermark

## Best Retry Instruction

When a generation is close but has one continuity error, do not rewrite the entire concept. Retry with the original prompt plus one direct correction at the very top:

> CORRECTION FROM THE PREVIOUS VERSION: [character] must remain in [exact seat or position] from the first frame through the final frame. Do not move, duplicate, replace, or re-seat this character. Preserve everything else.
