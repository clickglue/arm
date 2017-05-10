Arm the Artist
Based on code for Manny the Manipulator by Raquel Vélez <raquel@rckbt.me>
===

This is the Arm. 

It's build as MakeBlock Scara arm, running on two Steppermotors. They don't have memory, so all movements are stored in an array that is processed step by step. 
The Arduino board is flashed with Configurable Firmata.

Arm.js is the key file.
```
cd manny

npm install

npm start
```

You'll need a robot attached, and can view the browser-side bits at http://localhost:3000.

Watch a video of Manny on the move: http://youtu.be/2oNqa-cL_ZQ

