/**
 * @author wangxin45@jd.com
 * @date 2017/6/6
 */
import {render} from 'react-dom'
import React, {Component} from 'react'
import PullLoad, {STAT} from './PullLoad'

class List extends Component {
    constructor() {
        super();
        this.state = {action: STAT.init}
    }

    handleAction(action) {
        if(action = STAT.refreshing) {
            console.log("refreshing");
            setTimeout(function(){
                console.log('模拟网络访问');
                this.setState({action: STAT.init})
            }.bind(this),2000)
        }
    }

    render() {
        let list = [];
        for (let i = 10; i > 0; i--) {
            list.push(<div>list item</div>);
        }
        return (
            <PullLoad handleAction={this.handleAction.bind(this)} action={this.state.action}>
                <div>
                    {list}
                </div>
            </PullLoad>
        )
    }
}

render(<List></List>, document.getElementById('root'));