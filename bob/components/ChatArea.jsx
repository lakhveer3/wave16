import React from 'react';
import {Grid, Row, Col} from 'react-flexbox-grid/lib/index';
import ChatHistory from './ChatHistory.jsx';
import NewMessage from './NewMessage.jsx';
import Chip from 'material-ui/Chip';
import Paper from 'material-ui/Paper';
import SupervisorAccount from 'material-ui/svg-icons/action/supervisor-account';
import PersonAdd from 'material-ui/svg-icons/social/person-add';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import {BottomNavigation, BottomNavigationItem} from 'material-ui/BottomNavigation';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Popover, {PopoverAnimationVertical} from 'material-ui/Popover';
import request from 'superagent';
import Dialog from 'material-ui/Dialog';
import AutoComplete from 'material-ui/AutoComplete';
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import Favorite from 'material-ui/svg-icons/action/favorite';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Clear from 'material-ui/svg-icons/content/clear';
import {List,ListItem} from 'material-ui/List';
import Scrollbars from 'react-custom-scrollbars';

const styles = {
	chip: {
		marginBottom: 4,
	}
}

export default class Chat extends React.Component{
	constructor(props) 
	{
		super(props);
		this.state={typing:[],chatHistory:[],pagesDisplayed:0,
			next:"",searchText:"",members:[],addedMembers:[],
			openDrawer:false,booklist:[],addOpen:false,membersOpen:false,
			membersList:[],gitStatus:false,create:false};

			this.handleShowMembers=this.handleShowMembers.bind(this);
			this.handleMembersClose=this.handleMembersClose.bind(this);
			this.handleAddMembers=this.handleAddMembers.bind(this);
			this.handleClose=this.handleClose.bind(this);
			this.handleUpdateInput=this.handleUpdateInput.bind(this);
			this.handleNewRequest=this.handleNewRequest.bind(this);
			this.handleSubmit=this.handleSubmit.bind(this);
			this.handleLeave=this.handleLeave.bind(this);
			this.handleSelect=this.handleSelect.bind(this);
	}

	componentDidMount() {
		this.props.socket.on('someoneAdded',(name)=>{ //Sent when a user subscribes to the channel.
			this.handleSomeoneAdded(name);
		});
		this.props.socket.on('takeMessage',(channelID,msg)=>{ //Sent from this.props.socket server when a message is published in the redis channel.
			this.handleTakeMessage(channelID,msg);
		});
		this.props.socket.on('chatHistory',(msg,next)=>{ //msg is an array of objects having messages from a page in mongodb.
					console.log("historyhh",msg[0],next)
					this.handleChatHistory(msg,next);
		});
		// this.props.socket.on('typing',(name)=>{
		// 		this.handleTyping(name);
		// 	});
		this.props.socket.on('pempty',(msg)=>{
			this.handlePempty(msg);
		});
		this.props.socket.on("takeMembersList",(membersList)=>{
			this.setState({members:membersList,membersOpen:true});
		});
		this.props.socket.on("receiveBoomarkHistory",(receiveBoomarkHistory)=>{
			let a=this.props.channelID;
			//console.log(receiveBoomarkHistory[0].bookmark);
			//console.log("Received BookMark History",receiveBoomarkHistory[0].bookmark[this.props.channelID][0]);
			this.setState({booklist:receiveBoomarkHistory[0].bookmark});
		});
		this.props.socket.emit('bookmarkHistory',this.props.userName,this.props.channelID);
		this.props.socket.on("takeGitHubNotifications",(history)=>{
			this.setState({chatHistory:history,gitStatus:true});
            //console.log(history);
        });
	}

	componentWillReceiveProps(nextProps){
		//console.log(nextProps,this.props,"cwp chatarea outisde if");
		if(this.props.channelID!=nextProps.channelID){
			let msg = {"pageNo":"initial_primary","channelName":nextProps.channelID};//increment the pages displayed currently.
			nextProps.socket.emit('receiveChatHistory',msg);
			this.setState({chatHistory:[],gitStatus:false});
		}
	}

	handleSomeoneAdded(msg){
		//currently empty.
	}

	handleTakeMessage(channelId,msg){
		if(channelId===this.props.channelID){
			if(msg.hasOwnProperty('typer')){
				this.handleTyping(msg.typer);
			}
			else
			{
				//msg = this.handleTime(msg);
				this.setState((prevState,props)=>{
					prevState.chatHistory.push(msg);
					return {chatHistory:prevState.chatHistory};
				});
			}
		}
		else{
			if(msg.hasOwnProperty('typer')){
			}
			else
				{this.props.LiveUnreadCount(channelId);}
		}
	}
	handleChatHistory(msg,next){
		let mess = this.state.chatHistory;
		msg.forEach((msgob)=>{

			//msgob = this.handleTime(msgob);
			mess.unshift(msgob);
		});
		this.setState((prevState,props)=>{ 
			return {
				chatHistory:mess,
				pagesDisplayed:prevState.pagesDisplayed+1,
				next:next};
			});
	}

	handleToggle(){
		this.setState({openDrawer: !this.state.openDrawer});
	}

	handleTyping(name){
		if(!this.state.typing.includes(name))
		{
		this.setState((prevState,props)=>{prevState.typing.push(name); return {typing:prevState.typing};  });
		setTimeout(()=>{this.setState((prevState,props)=>{prevState.typing.shift(); return {typing:prevState.typing};  });},1000);
		} //show user is typing for 1000 milliseconds.
	}

	handlePempty(msg){
		let msg1 = {
			"pageNo":msg,
			"channelName":this.props.channelId
		};
		if(this.props.channelID.split("#")[1]!="GitHub"){
			this.props.socket.emit('receiveChatHistory',msg1);
		}
		else{
			//console.log("GitHub Channel is Clicked");
			this.props.socket.emit("GetGitHubNotifications",this.props.userName);
		}
	}

	handleShowMembers(event){
		this.setState({ anchorEl: event.currentTarget});
		this.props.socket.emit("getMembersList",this.props.channelID);
	}

	handleMembersClose(){
		this.setState({membersOpen:false});
	}

	handleAddMembers(){
		let a=this.props.channelID.split("#");
		request.get("http://localhost:8000/add/"+a[0]+"/channel/"+a[1]).end((err,res)=>{
			res=JSON.parse(res.text);
			this.setState({membersList:res.data,addOpen:true,create:false});
		})
	}


	handleUpdateInput(searchText){
		this.setState({
			searchText: searchText,
		});
	};

	handleClose(){
		this.setState({addOpen:false})
	}

	handleNewRequest(){
		var a=this.state.searchText;
		var b=this.state.membersList;
		var c=b.indexOf(a);
		if(c>-1){
			b.splice(c,1);
			let z = this.state.addedMembers;
			z.push(this.state.searchText);
			this.setState({membersList:b,addedMembers:z,searchText:"",create:true,addMemberError:""});
		}
		else{
			this.setState({addMemberError:"Member not present in Project"});
		}	
	}


	handleRequestDelete(item){
		var a=this.state.addedMembers;
		var b=a.indexOf(item);
		a.splice(b,1);

		this.setState({addedMembers:a});
		this.state.membersList.push(item);
	}

	handleSubmit(){
		if(this.state.addedMembers.length>0)
			{this.props.socket.emit("addMembers",this.props.channelID,this.state.addedMembers);}
		this.setState({addOpen:false,create:false});
	}

	handleLeave(){
		this.props.socket.emit("leaveGroup",this.props.channelID,this.props.userName);
	}
	handleSelect(book,event,status){
		console.log("bookmark",book,event,status)
		if(status){
			this.state.booklist.push(book);
			this.props.socket.emit('saveBookmarks',book,this.props.userName,this.props.channelID,);
		}
	 	else{
 			var indexno=this.state.booklist.indexOf(book);
			this.state.booklist.splice(indexno,1);
			this.props.socket.emit('deleteBookmarks',book,this.props.userName,this.props.channelID);
		}
 	}
 	deleteMessage(i){
 		let newarr = this.state.chatHistory;
		newarr.splice(i,1);
 		this.setState({chatHistory:newarr});
 	}
 	editMessage(i,newMsg,arr_1){
 		console.log(i,newMsg,arr_1,arr_1[0].msg)
 		let newarr = this.state.chatHistory;
 		arr_1[0].msg = newMsg;
 		newarr.splice(i,1,arr_1[0]);
 		this.setState({chatHistory:newarr});
 	}
 	render(){
 		let typ;
		if(this.state.typing.length===1){
			typ = <Chip>{this.state.typing + " is typing"}</Chip>;
		}
		else if(this.state.typing.length>1 && this.state.typing.length<6)
			typ = <Chip>{this.state.typing + " are typing"}</Chip>;
		else if(this.state.typing.length>1)
		{
			typ = <Chip>{this.state.typing.slice(0,5) + " and others are typing"}</Chip>
		}
		else
		{
			typ = null;
		}

		const actions = <RaisedButton label="Add" disable={!this.state.create} primary={true} onTouchTap={this.handleSubmit}/>
		let display =  
			<Dialog title="AddMembers" actions={actions} modal={false} open={this.state.addOpen} onRequestClose={this.handleClose}>
				<AutoComplete style={{marginTop:"20px",marginBottom:"20px"}} hintText="Add" searchText={this.state.searchText}  maxSearchResults={5} onUpdateInput={this.handleUpdateInput} onNewRequest={this.handleNewRequest} dataSource={this.state.membersList} filter={(searchText, key) => (key.indexOf(searchText) !== -1)} openOnFocus={true} /><br/>
					{this.state.addedMembers.map((item,i)=>{
					return(<Chip key={i} onRequestDelete={this.handleRequestDelete.bind(this,item)} style={styles.chip}>{item}</Chip>)
					})}
			</Dialog>
		let leave=null;
		if(this.props.channelID.split("#")[1]!="general"){
			leave=<IconButton ><ExitToApp onTouchTap={this.handleLeave}/></IconButton>
		}
		return(
			
			<center style={{height:"100%",width:"100%"}}>
				<Paper style={{height:"100%",width:"100%",border: 'solid 1px #d9d9d9'}}>
					<Grid  style={{height:'100%', width:"100%"}}>
						<Row style={{ height:'8%',overflow:'hidden',width:"100%",margin:"0px"}}>
							<Col xs={12} sm={12} md={12} lg={12} style={{height:'100%'}}>
								<Row style={{ height:'100%',overflow:'hidden',width:"100%",margin:"0px"}}>
									<Col xs={6} sm={6} md={6} lg={6} style={{height:'100%', fontWeight: 'bold', padding:15}}>
										<div style={{float: 'left'}}>
										{this.props.presentChannel}
										</div>
									</Col>

									<Col xs={6} sm={6} md={6} lg={6} style={{height:'100%'}}>
										<div style={{float: 'right'}}>
											<Paper zDepth={0}>											
												<IconMenu open={this.state.membersOpen}
													onTouchTap={this.handleShowMembers}
													iconButtonElement={<IconButton><SupervisorAccount/></IconButton>}
													anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
													targetOrigin={{horizontal: 'left', vertical: 'top'}}
													onRequestChange={this.handleMembersClose}
												>
													{this.state.members.map((item,i)=>{
														return(<MenuItem key={i} primaryText={item}/>)
													})}
												</IconMenu>
												<IconMenu iconButtonElement={<IconButton onTouchTap={this.handleAddMembers}><PersonAdd /></IconButton>} >
												</IconMenu>
												<IconButton onTouchTap={this.handleToggle.bind(this)}>
													<Favorite />
												</IconButton>
												{leave}
											</Paper>

											<Drawer width={400} openSecondary={true} open={this.state.openDrawer} >
												<AppBar style={{backgroundImage:"url('http://localhost:8000/static/images/header.jpg')",marginTop:"0px"}} 
													title="Bookmarks" iconElementLeft={<IconButton iconStyle={{color:"white"}} onTouchTap={this.handleToggle.bind(this)}><Clear/> </IconButton>}></AppBar>
												<List>
													{this.state.booklist.map((item,i)=>{
														return(<ListItem key={i}><Paper>{item.TimeStamp}<br/>{item.msg}<br/>{item.sender}</Paper></ListItem>)
														})
													}
												</List>
											</Drawer>
											{display}
										</div>
									</Col>
								</Row>
							 
								
							</Col>
						</Row>
						<Row style={{ height:'4%',overflow:'hidden',width:"100%"}}>
							<Col xs={12} sm={12} md={12} lg={12} style={{height:'100%'}}>
								{typ}
							</Col>
						</Row>
						<Row style={{height:'78%',overflowY:'auto',width:"100%"}}>
							<Col xs={12} sm={12} md={12} lg={12}>
								<Scrollbars style={{width:"100%", height:"100%"}}>
									<ChatHistory userName={this.props.userName} gitStatus={this.state.gitStatus} editMessage={this.editMessage.bind(this)} deleteMessage={this.deleteMessage.bind(this)} avatars={this.props.avatars} channelId={this.props.channelID} psocket={this.props.socket} next={this.state.next} bookmark={this.handleSelect} username={this.props.userName} chatHistory={this.state.chatHistory}/>
								</Scrollbars>
							</Col>
						</Row>
						<Row bottom="lg" style={{height:"10%",width:'100%'}}>
							<Col xs={12} sm={12} md={12} lg={12}>								
								<NewMessage channelId={this.props.channelID} psocket={this.props.socket} name={this.props.userName} />								
							</Col>
						</Row>
					</Grid>
				</Paper>
			</center>
			
		);
	}
}
