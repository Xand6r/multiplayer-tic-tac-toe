// serviceworker controller
if(navigator.serviceWorker){
  navigator.serviceWorker.register("/sw.js")
    .then(()=>{
        console.log("service worker started.");
    })
    .catch(()=>{
        console.log("there was an error registering your service worker.")
    })  
}


// vue controller
const app=new Vue({
    el:"#app",
    data:{
        userScore:0,
        online:false,
        gameStatus:"notStarted",
        board:["x","o","x","x","o","o","o","x","x"],
        winningBox:[0,0,0,0,0,0,0,0,0],
        playable:["x","o"],
        headerInfo:"X and O",
        firstPlay:true,
        level:null,
        multiplayerMenu:false,
        mode:"singlePlayer",
        opponent:null,
        openMultiplayerBar:false,
        socket:null,
        nickname:"",
        loading:true,
        multiplayerError:null,
        onlinePlayers:[],
        modeOptions:{
            "singlePlayer":{
                opponent:"computer",
                opponentScore:0,
                turn:"",
                myId:null,
                otherId:null
            },
            "multiPlayer":{
                opponent:null,
                opponentId:null,
                opponentScore:0,
                turn:"",
                myId:null,
                otherId:null
            }
        }
        // this.modeOptions[this.mode]['otherId']
    },
    mounted() {
        setTimeout(()=>{
        if(window.navigator.onLine){
            this.nickname=prompt("please enter a nickname for multiplayer")||`user${(Math.random()*50).toFixed(0)}`

            this.socket=io();
            this.socket.on('connect',e=>{
                this.online=true;
                this.socket.emit("new-player-add",this.socket.id,this.nickname)
                this.socket.on("request-play-request",(request,senderId)=>{
                    do{
                        answer=(prompt(request+"(yes/no)")||"").toLowerCase()

                    }
                    while(!['yes','no'].includes(answer))
                    if(answer=="yes"){
                        this.error("you have just accepted a multiplayer game. prepare for play")
                        // set game mode to multiplayer
                        this.mode="multiPlayer";
                        this.openMultiplayerBar=false;
                        this.reset();
                        this.board=["","","","","","","","",""],
                        this.winningBox=[0,0,0,0,0,0,0,0,0];
                        this.gameStatus="started";
                        this.modeOptions[this.mode]['opponent']=request.slice(0,-38);
                        this.modeOptions[this.mode]['turn']=request.slice(0,-38);
                        this.modeOptions[this.mode]['otherId']=2;
                        this.modeOptions[this.mode]['myId']=1;     
                        this.modeOptions[this.mode]['opponentId']=senderId;
                        // play second
                    }
                    this.socket.emit("request-play-request-reply",answer,senderId)
                })
                this.socket.on("your-turn",(pos)=>{
                    this.board[pos]=this.playable[this.modeOptions[this.mode]['otherId']-1];
                    this.checkForWinner();
                    this.modeOptions[this.mode]['turn']="you";

                })
                this.socket.on("disconnect",e=>{
                    this.online=false;
                    this.checkFriend();
                    alert("disconnected");
                })
                this.socket.on("left-alone",()=>{
                    this.error(`${this.modeOptions[this.mode]['opponent']} has left the game`,4000);
                    this.gameStatus="ended";
                })
            })

        }
        else{
            this.openMultiplayerBar=false;
            Materialize.toast("you are currently offline please connect to the internet and reload for multiplayer!!.",2000)
        }
    },100)
    },
    methods:{
        error(str,t){
            let time=t||1500
            Materialize.toast(str,time)
        },
        reset(){
            this.board=["","","","","","","","",""];
            this.userScore=0;
            this.winningBox=[0,0,0,0,0,0,0,0,0];
            this.error("game has been reset",1500);
            this.currentPlayer=null;
            this.modeOptions[this.mode]['myId']=null;
            this.modeOptions[this.mode]['otherId']=null;
            this.firstPlay=true;
            this.modeOptions["singlePlayer"]['opponentScore']=0;
            this.modeOptions["multiPlayer"]['opponentScore']=0;
            this.checkFriend()
        },
        restart(){
            this.board=["","","","","","","","",""];
            this.winningBox=[0,0,0,0,0,0,0,0,0];
            this.gameStatus="started";
            this.firstPlay=true;
            this.modeOptions["singlePlayer"]['turn']="human";
        },
        start(){
            this.checkFriend()
            let player=(prompt("do you want to play first(y/n)")||"").toLowerCase();
            if(player!="y" && player!="n"){
                this.error("please enter 'y' or 'n'");
                return;
            }
            this.mode="singlePlayer";
            let level=Number(prompt("enter the level you'ld like to play on (1-3)")||0);
            if(level<1 || level>3){
                this.error("enter a level between 1 and 3");
                return;
            }
            this.level=level;
            this.reset();
            this.gameStatus="started";
            this.modeOptions[this.mode]['myId']=(player=="y")?1:2;
            this.modeOptions[this.mode]['otherId']=(player=="y")?2:1
            if (player=="n"){
                this.modeOptions[this.mode]['turn']="computer";
                this.computerPlay();
            }
            else{
                this.modeOptions[this.mode]['turn']="human";
            }
            
        },
        play(index){
            if(this.gameStatus=="notStarted"){
                this.error("please start a game first");
                return;
            }
            if(this.gameStatus=="ended"){
                this.error("the current game has ended please start another one");
                return;
            }

            else if(this.modeOptions[this.mode]['turn']=="human"||this.modeOptions[this.mode]['turn']=="you"){
                if(this.isPlayable(index)){
                    this.board[index]=this.playable[this.modeOptions[this.mode]['myId']-1];
                    this.checkForWinner();
                    if (this.mode=="singlePlayer" && this.gameStatus!="ended"){
                        this.modeOptions[this.mode]['turn']="computer";
                        setTimeout(()=>this.computerPlay(),500);
                    }
                    else{
                        this.modeOptions[this.mode]['turn']=this.modeOptions[this.mode]['opponent'];
                        this.otherPlayer(index);
                    }
                }
                else{
                    this.error("you cannot play here");
                }
            }
            else{
                this.error("not your turn to play");
                return;
            }

        },
       isPlayable(index){
           return this.board[index]=="";
       },
        checkForWinner(){
            if(this.board[0]==this.board[1] && this.board[1]==this.board[2] && this.board[0]!=""){
                winner=(this.playable.indexOf(this.board[0])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                    this.userScore+=1;
                    this.winningBox[0]=this.winningBox[1]=this.winningBox[2]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[0]=this.winningBox[1]=this.winningBox[2]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[4]==this.board[5] && this.board[5]==this.board[3] && this.board[3]!=""){
                winner=(this.playable.indexOf(this.board[4])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[3]=this.winningBox[4]=this.winningBox[5]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[3]=this.winningBox[4]=this.winningBox[5]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[7]==this.board[6] && this.board[8]==this.board[6] && this.board[6]!=""){
                
                winner=(this.playable.indexOf(this.board[7])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[6]=this.winningBox[7]=this.winningBox[8]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[6]=this.winningBox[7]=this.winningBox[8]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[0]==this.board[3] && this.board[3]==this.board[6] && this.board[6]!=""){
                winner=(this.playable.indexOf(this.board[0])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[0]=this.winningBox[3]=this.winningBox[6]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[0]=this.winningBox[3]=this.winningBox[6]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[1]==this.board[4] && this.board[4]==this.board[7] && this.board[1]!=""){
                winner=(this.playable.indexOf(this.board[1])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[1]=this.winningBox[4]=this.winningBox[7]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[1]=this.winningBox[4]=this.winningBox[7]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[2]==this.board[5] && this.board[5]==this.board[8] && this.board[8]!=""){
                winner=(this.playable.indexOf(this.board[2])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[2]=this.winningBox[5]=this.winningBox[8]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[2]=this.winningBox[5]=this.winningBox[8]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[0]==this.board[4] && this.board[4]==this.board[8] && this.board[8]!=""){
                winner=(this.playable.indexOf(this.board[0])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[0]=this.winningBox[4]=this.winningBox[8]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[0]=this.winningBox[4]=this.winningBox[8]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board[2]==this.board[4] && this.board[4]==this.board[6] && this.board[2]!=""){
                winner=(this.playable.indexOf(this.board[2])+1==this.modeOptions[this.mode]['myId'])?"you":this.modeOptions[this.mode]['opponent']
                if(winner=="you"){
                       this.userScore+=1;
                       this.winningBox[2]=this.winningBox[4]=this.winningBox[6]=1
                }
                else{
                    this.modeOptions[this.mode]['opponentScore']+=1;
                    this.winningBox[2]=this.winningBox[4]=this.winningBox[6]=2;
                }
                this.headerInfo=`winner:${winner}`;
                this.gameStatus="ended";
            }
            else if(this.board.indexOf("")==-1){
                this.headerInfo="its a  draw"
                this.gameStatus="ended";
            }
    
        },
       computerPlay1(){
            do {
                randPoint=Math.floor(Math.random()*9);
            } while (!this.isPlayable(randPoint));
            this.board[randPoint]=this.playable[this.modeOptions[this.mode]['otherId']-1];
            this.checkForWinner();
            this.modeOptions[this.mode]['turn']="human";
       },
       calcVertical(start,myToken,otherToken){
            points=[start%9,(start+3)%9,(start+6)%9];
            return this.calcScore(points,myToken,otherToken);
       },
       calcDiagonal(start,myToken,otherToken){
            let leftDiag=[2,4,6];
            let rightDiag=[0,4,8];
            let points=[];

            if (leftDiag.some(e=>e===start)){
                points=leftDiag.slice();
                return this.calcScore(points,myToken,otherToken)
            }
            else if(rightDiag.some(e=>e===start)){
                points=rightDiag.slice()
                return this.calcScore(points,myToken,otherToken)
            }
            else return 0;
            
       },
       calcHorizontal(start,myToken,otherToken){
           let top=[0,1,2];
           let middle=[3,4,5];
           let bottom=[6,7,8];

           if(top.some(e=>e===start)){
               return this.calcScore(top.slice(),myToken,otherToken);
           }
           else if(middle.some(e=>e===start)){
               return this.calcScore(middle.slice(),myToken,otherToken)
           }
           else{
               return this.calcScore(bottom.slice(),myToken,otherToken)
           }
       }
       ,
       calcScore(points,myToken,otherToken){
            let Urgency=points.reduce((aggr,current)=>{
                aggr.myCount+=(this.board[current]==myToken);
                aggr.otherCount+=(this.board[current]==otherToken);
                return aggr;
            },{myCount:0,otherCount:0});

            if(Urgency.myCount==2){
                return 3;
            }
            else if(Urgency.otherCount==2){
                return 2;
            }
            else if(Urgency.otherCount==1){
                return -1
            }
            else if(Urgency.myCount==1){
                return 1;
            }
            else{
                return 0;
            }
       },
       computerPlay2(){
           let bestScore=-Infinity;
           let bestIndex=0;

           let myToken=this.playable[this.modeOptions[this.mode]['otherId']-1];
           let otherToken=this.playable[this.modeOptions[this.mode]['myId']-1];
            if(this.firstPlay){
                this.computerPlay1();
                this.firstPlay=false;
            }
            else{
                for(let index=0;index<this.board.length;index++){
                    if(this.isPlayable(index)){
                        let vt=this.calcVertical(index,myToken,otherToken);
                        let dg=this.calcDiagonal(index,myToken,otherToken);
                        let hr=this.calcHorizontal(index,myToken,otherToken);

                        let tempScore=Math.max(vt,dg,hr);
                        // loss function is the total loss across the board;
                        if(tempScore>bestScore){
                            bestScore=tempScore;
                            bestIndex=index;
                        }
                        // console.log(`index:${index},v-point:${vt},h-point:${hr},d-point:${dg}`,vt+hr+dg)
                    }
                    
                }
                // console.log(bestIndex);
                this.board[bestIndex]=this.playable[this.modeOptions[this.mode]['otherId']-1];
                this.checkForWinner();
                this.modeOptions[this.mode]['turn']="human";
            }
       },
       computerPlay3(){
           let bestScore=-Infinity;
           let bestIndex=0;

           let myToken=this.playable[this.modeOptions[this.mode]['otherId']-1];
           let otherToken=this.playable[this.modeOptions[this.mode]['myId']-1];
            if(this.firstPlay){
                this.computerPlay1();
                this.firstPlay=false;
            }
            else{
                for(let index=0;index<this.board.length;index++){
                    if(this.board[index]==""){
                        let vt=this.calcVertical(index,myToken,otherToken);
                        let dg=this.calcDiagonal(index,myToken,otherToken);
                        let hr=this.calcHorizontal(index,myToken,otherToken);

                        // loss function is the total loss across the board;
                        let tempScore=vt+dg+hr;
                        if(tempScore>bestScore){
                            bestScore=tempScore;
                            bestIndex=index;
                        }
                        // console.log(`index:${index},v-point:${vt},h-point:${hr},d-point:${dg}`,vt+hr+dg)
                    }
                    
                }
                // console.log(bestIndex);
                this.board[bestIndex]=this.playable[this.modeOptions[this.mode]['otherId']-1];
                this.checkForWinner();
                this.modeOptions[this.mode]['turn']="human";
            }
       },
       computerPlay(){
           let plays=[this.computerPlay1,this.computerPlay2,this.computerPlay3];
           plays[this.level-1]();
       },
       multiplayerStart(){
           if(!this.socket){
               this.error("please connect to the internet and reload the page");
               return;
           }
            this.openMultiplayerBar=true;
            fetch("/onlineUsers").then(res=>res.json())
            .then(res=>{
                if(res.length==1){
                    this.multiplayerError="There are no online players";
                    setTimeout(()=>this.loading=false,1000);
                }
                else{
                    let online=JSON.parse(JSON.stringify(res));
                    this.onlinePlayers=online.filter((current)=>{
                        return current.nickname!=this.nickname
                    })
                    this.multiplayerError=null;
                    setTimeout(()=>this.loading=false,1000);
                    // =false;
                }

                // connect to the chat server
            })
            .catch(err=>{
                this.multiplayerError="there was an error fetching please reload your browser";
                this.loading=false; 
            })
            // fetch all online players
            // upon failure close the openmultiplayerbar
       },
       exitMulti(){
            this.multiplayerError=null;
            this.loading=true;
            this.openMultiplayerBar=false;
       },
       otherPlayer(index){
        // emit an event indicating its the other player's turn

            let id=this.modeOptions[this.mode]['opponentId'];
            this.socket.emit("Your-turn",id,index);
       },
       requestPlay(opponentInfo){
        //    send a requests using socket io for the other person to play
            if(!this.nickname){
                Materialize.toast("please enter a nickname",1000);
                return;
            }
            this.loading=true;
            this.socket.emit("request-play-send",`${this.nickname} is requesting to play online with you`,opponentInfo.id,this.socket.id)
            this.socket.on("request-play-request-reply",(answer)=>{
                if(answer=="yes"){
                    this.error("your request was accepted, prepare for play",2500)
                    this.mode="multiPlayer";
                    this.openMultiplayerBar=false;
                    this.reset();
                    this.gameStatus="started";
                    this.modeOptions[this.mode]['opponent']=opponentInfo.nickname;
                    this.modeOptions[this.mode]['opponentId']=opponentInfo.id;
                    this.modeOptions[this.mode]['turn']="you";
                    this.modeOptions[this.mode]['otherId']=1;
                    this.modeOptions[this.mode]['myId']=2;        
                }
                else{
                    this.error("your request was rejected,try again or play alone",2500)
                    this.exitMulti();
                }
                
            })
        // upon recieval begin the multiplayer

            // make your move
       },
       checkFriend(){
           if(this.mode=="multiPlayer"){
               this.socket.emit("left-alone",this.modeOptions[this.mode]['opponentId'])
           }
       }
        
    }
})

// upon multiplayer click listen for an event saying its your turn

// todo:
// if someone presses reset during a multiplayer game,send to the opponentthat he don left


