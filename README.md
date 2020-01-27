# hyper-snippet
Help you create code snippet for your hyper terminal 


## Quick Start:
* install by ```hyper install hyper-snippet``` and restart your terminal
* open hyper-snippet by type ```open hconf``` and hit ```TAB```, this will expand the command to "open ~/.hyper_plugins/hyper-snippet.js", hit ```ENTER``` to open it
* Add the snippet in ```hyper-snippet.js``` as following: 
```javascript
module.exports = {
  
  // the command you want define snippet
  "ssh":{
    "server1":"root@198.162.1.1" // the snippet name and the content
  }
}
``` 
* Refresh your terminal or restart it and type ```ssh server1``` and hit ```TAB```, this will expand the command to ```ssh root@198.162.1.1``` 

## Functions

### 1. Command Level snippet
The Command Level snippet is like ```<command> <snippet-name>```. You can expand the snippet by hit ```TAB```. This will replace the ```<snippet-name>``` with the ```<text>``` you defined.
To define Command Level snippet, add the following inside ```hyper-snippet.js```
```javascript
module.exports = {
  ...
  // the command you want define snippet
  "<command>":{
    "<snippet-name>":"<text>" // the snippet name and the content
  }
  ...
}
```
### 2. Sub Command Level snippet
The Sub Command Level snippet is like ```<command> <sub-command> <snippet-name>```. You can expand the snippet by hit ```TAB```. This will replace the ```<snippet-name>``` with the ```<text>``` you defined.
To define Sub Command level snippet, add the following inside ```hyper-snippet.js```
```javascript
module.exports = {
  ...
  // the command you want define snippet
  "<command>":{
    $subcmds:{
      "<sub-command>":"<text>"
    } 
  }
  ...
}
``` 

### 3. Variable you could use for snippet
You can use 2 variables ```#CLIP#```  and ```#END#``` inside the text.

#### 3.1 ```#CLIP#```
```#CLIP#``` will replace the ```#CLIP#``` with the text inside your clipboard after you expand the snippet.
Here is a sample for snippet which is useful to clone projet from git
```javascript
// snippet definition
module.exports = {
  ...
  // the snippet to debug docker, when expand, the id of the docker container is from clipboard
  "git":{
    c:"clone #CLIP#"
  }
  ...
}
```

#### 3.2 ```#END#```
```#END#``` indicate where your cursor will show after expanding the snippet
Here is a sample for snippet which is useful to run docker container
```javascript
// snippet definition
module.exports = {
  ...
  // the snippet to run docker container, when expand, the cursor move before the name of docker image, you can continue to add other options
  "docker":{
    rr:"run #END# #CLIP#"
  }
  ...
}
```

Here is a demo for it


### 4. Customize the snippet with function
TODO
### 5. Default Hanlder
TODO
 


