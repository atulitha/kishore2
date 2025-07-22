let layer = document.getElementById("new-layer")
let cancel = document.getElementById("new-cancel")
let menu = document.getElementById("new-menu")

menu.addEventListener("click",(e)=>{
    console.log("clicked menu atleast")
    layer.style.display="block"
})
cancel.addEventListener("click",(e)=>{
    console.log("clicked cancel atleast")
    layer.style.display="none"
})
