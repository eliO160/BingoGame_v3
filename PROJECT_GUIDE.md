# For new contributors...

## File Overview
/public : add static assets served at the root here, like images
/src : add source code files here

/src/app : routing and page layout files. add new routes here.
- page.js: root page for the app. 
- globals.css: global style rules.

/src/components : add a new visual building blocks here.
- Header.js : text mounted above the Card with convention titling.
- Rules.js : text mounted under the Card detailing rules of the game to users.
- Box.js : a single Bingo cell. Holds the current data model for the Box component.
- Card.js : the 5x5 grid.

/src/components/ui : add reusable user-interface components here.
- WinButton.js : Small, self-contained button + popover that displays “I’ve won Bingo!” proof.

/src/utils: add helper functions and logic here.
- checkWin.js : Function that encapsulates all winning line combinations; reusable in tests or backend

