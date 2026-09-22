export const CAR_POOL_PROMPT = `EDIT @Video1.

Keep @Video1 as the source video. Preserve its original camera angles, cuts,
timing, movement, car interior, lighting, framing, choreography and audio.

Replace the five people in @Video1 with the five people from the reference images.

IDENTITY MAP

@Image1 = DRIVER
@Image2 = FRONT PASSENGER
@Image3 = REAR LEFT PASSENGER
@Image4 = REAR MIDDLE PASSENGER
@Image5 = REAR RIGHT PASSENGER

This identity map is fixed for the entire video.

IDENTITY IS THE HIGHEST PRIORITY.

Each seat is a permanent character slot:

DRIVER is always @Image1.
FRONT PASSENGER is always @Image2.
REAR LEFT is always @Image3.
REAR MIDDLE is always @Image4.
REAR RIGHT is always @Image5.

Treat all five people as completely separate identities.

Never blend facial features between reference images.
Never transfer one person's face to another seat.
Never average two identities together.
Never swap identities after a camera cut.
Never allow one reference image to influence another person's face.

For each person preserve their distinctive:
- facial structure
- eyes and eyebrows
- nose
- mouth
- jaw
- skin tone
- facial hair
- hairstyle and hair colour

Use each reference image ONLY for its assigned person.

After every camera cut, re-establish the identity map before rendering the shot:

Driver → @Image1
Front Passenger → @Image2
Rear Left → @Image3
Rear Middle → @Image4
Rear Right → @Image5

VIDEO PRESERVATION

Do not recreate or reinterpret @Video1.

Preserve the original:
- camera position
- camera movement
- framing
- cuts
- shot timing
- car
- seats
- steering wheel
- windows
- exterior scenery
- lighting
- colour
- body positions
- gestures
- choreography
- audio

The five replacement characters inherit the original occupants' exact positions,
poses and movements.

Do not change the spatial footprint or position of the original occupants.

APPEARANCE

Replace each occupant's face, hair and visible appearance using only their assigned
reference image.

Preserve the original body's pose, proportions and movement wherever possible.

Facial identity accuracy is more important than matching minor clothing details,
hair movement, fingers or subtle facial expressions.

OCCLUSION

When a face becomes partially hidden, turned sideways, blurred by motion, or
obscured by another person or part of the car, maintain the same identity.

Do not reconstruct a different face when the person becomes visible again.

The rear passengers are three separate people:
LEFT = @Image3
MIDDLE = @Image4
RIGHT = @Image5

Their proximity must never cause their faces or features to merge.

TEMPORAL CONSISTENCY

Maintain the same five identities from the first frame to the final frame.

At every cut, angle change and head turn, each person's face must remain recognizably
the same person from their assigned reference image.

No identity drift.
No identity swapping.
No face blending.
No duplicated faces.
No hybrid faces.
No reference leakage between characters.

FINAL PRIORITY ORDER

1. Correct identity for each seat.
2. Stable and recognizable faces.
3. Keep all five identities separate.
4. Preserve @Video1's original composition and motion.
5. Preserve hairstyle and visible clothing.
6. Preserve minor expression and clothing details.

If any requirements conflict, prioritize correct facial identity and seat assignment.`;
