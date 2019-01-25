const express=require("express");
const app=express();
const http=require("http").Server(app);
const onlineUsers=[];

const io=require("socket.io")(http);
io.on("connect",socket=>{

    socket.on("Your-turn",(receiverId,pos,senderId)=>{
        
        io.to(receiverId).emit("your-turn",pos);
    });

    socket.on("left-alone",opponentId=>{
        io.to(opponentId).emit("left-alone");
    })


    socket.on("request-play-send",(text,receiverId,senderId)=>{
        io.to(receiverId).emit("request-play-request",text,senderId);
    })
    
    socket.on("new-player-add",(socketId,nickname)=>{
        onlineUsers.push({nickname:nickname,id:socketId});
    })
    
    
    socket.on("request-play-request-reply",(answer,senderId)=>{
        io.to(senderId).emit("request-play-request-reply",answer);
    })


    socket.on("disconnect",e=>{
        let index=-1;
        for( let i=0;i<onlineUsers.length;i++){
            if(onlineUsers[i].id==socket.id){
                index=i;
            }
        }
        if(index!=-1){
            onlineUsers.splice(index);
        }
        // remove the socket
    })
})

const PORT=process.env.PORT||8080;

app.get("/onlineUsers",(req,res)=>{
    res.json(onlineUsers);
})
app.use(express.static("./public"));

http.listen(PORT,()=>console.log(`server started on port ${PORT}`));