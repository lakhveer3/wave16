import React from 'react';
import AppBar from 'material-ui/AppBar';
import Feedback from 'material-ui/svg-icons/action/feedback';
import SettingsPower from 'material-ui/svg-icons/action/settings-power';
import IconButton from 'material-ui/IconButton';
import {Link,hashHistory} from 'react-router';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import cookie from 'react-cookie';
import Notifications from 'material-ui/svg-icons/social/notifications';
import Chat from 'material-ui/svg-icons/communication/chat';
import Add from 'material-ui/svg-icons/content/add';
import io from 'socket.io-client';
import Avatar from 'material-ui/Avatar';

var base64 = require('base-64');
var utf8 = require('utf8');
export default class Header extends React.Component{
	componentDidMount()
	{
		this.state.localEmitter.on('swapNotifications',this.handleToggle)
	}
	getChildContext(){
		return {
			socket:this.state.socket
		};
	}

	constructor(props,context) {
		super(props,context);
		this.state = {
					open: false,
					icons: <Link to={'notification'}><IconButton tooltip="Notifications" tooltipPosition="bottom-right" iconStyle={{color:"white"}}><Notifications/></IconButton></Link>,
					socket:io('http://localhost:8000'),
					localEmitter:this.context.theEmitter,
			};
		this.handleToggle = this.handleToggle.bind(this);
		this.handleLogOut=this.handleLogOut.bind(this);

	}
		handleLogOut(){
			cookie.remove("Token");
		}

		handleToggle(){
		console.log('inside handleToggle',this.props.location.pathname);
		if(this.props.location.pathname=="/notification"){
			hashHistory.push('/bob');
			this.setState({icons:<Link to={'bob'}><IconButton tooltip="Notifications" tooltipPosition="bottom-right" iconStyle={{color:"white"}}><Notifications/></IconButton></Link>})
		}
		else{
			hashHistory.push('/notification');
			this.setState({icons:  <Link to={'notification'}><IconButton tooltip="Chat Screen" tooltipPosition="bottom-right" iconStyle={{color:"white"}}><Chat/></IconButton></Link>})
		}
	};

	render(){
		var data;
	    if(cookie.load("Token")!=undefined)
	    {
	    	var a=cookie.load("Token");
            var b=base64.decode(a.split('.')[1]);
            var userName=utf8.decode(b);
            var avatar_url=a.split("#")[1];
			data =	<div>
					<Link to={'project'}><IconButton tooltip="Create Project" tooltipPosition="bottom-left" iconStyle={{color:"white"}}><Add/></IconButton></Link>
					<IconButton><Avatar src={avatar_url}/></IconButton>
					<span style={{color:"white",marginLeft:"20px"}}>{userName}</span>
					<Link to={'/'}><IconButton tooltip="LogOut" tooltipPosition="bottom-left" onTouchTap={this.handleLogOut} iconStyle={{color:"white"}}><SettingsPower/></IconButton></Link>
				</div>
		}
		else
		{
			data = <Link to={'feedback'}><IconButton tooltip="FeedBack" tooltipPosition="bottom-left" iconStyle={{color:"white"}}><Feedback/></IconButton></Link>
		}


		return(
			
			<div style={{margin:"0px",padding:"0px"}}>
				<AppBar title="Bob" iconElementLeft={this.state.icons} onLeftIconButtonTouchTap={this.handleToggle} style={{backgroundImage:"url('http://localhost:8000/static/images/header.jpg')",marginTop:"0px"}} >
		        {data}
				</AppBar>
				{this.props.children}
			</div>
			
			);


		}
}
Header.contextTypes = {
  theEmitter: React.PropTypes.object
};

 Header.childContextTypes = {
   socket: React.PropTypes.object
 };