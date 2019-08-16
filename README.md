# multiplayer-tic-tac-toe
A Vue.js and Node.js of an online multiplayer and single player of tic-tac-toe against an AI agent. it runs without internet as well with service workers.
the code for the intelligent agent can be found in `public/js/script.js`

### running and setting up the application
(1) firstly run `npm install` in the root folder of the project<hr/>
(2) then run `node index.js` : it then brings out the port o which the server as been started <hr/>
(3) open your browser and go to the adress http://localhost:'port' <hr/>
note: 'port' should be replaced by the port which the server is set to run on.

### playing the game
it should be noted that there is a multiplayer mode too, implemented using vue.js and socket.io for real time playing between clients
