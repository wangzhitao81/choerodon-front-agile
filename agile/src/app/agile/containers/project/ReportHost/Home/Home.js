import React, { Component } from 'react';
import {
  Page, Header, Content, stores, 
} from 'choerodon-front-boot';
import './style';
import list from './list';

const { AppState } = stores;

class Home extends Component {
  handleClickItem(report) {
    const { history } = this.props;
    const urlParams = AppState.currentMenuType;
    const {
      type, id, name, organizationId, 
    } = urlParams;
    history.push(`${report.link}?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`);
  }

  renderContentLinks() {
    return list.map(report => (
      <div
        key={report.key}
        className="c7n-item"
        role="none"
        onClick={this.handleClickItem.bind(this, report)}
      >
        <div className="c7n-item-pic">
          <div className={`c7n-item-picWrap ${report.pic}`} />
        </div>
        <div className="c7n-item-word">
          <h4 className="c7n-item-title">{report.title}</h4>
          <p className="c7n-item-des">{report.des}</p>
        </div>
      </div>
    ));
  }

  render() {
    return (
      <Page>
        <Header title="所有报告" />
        <Content
          title="所有报告"
          description="这里会根据您项目的进展情况以多个维度直观地记录和展示您项目、迭代、版本、进度等汇总情况。点击您需要查看的报告类型可以查看具体的详细内容。"
          link="http://v0-9.choerodon.io/zh/docs/user-guide/agile/report/"
        >
          <div className="c7n-reportHome-pane">
            {this.renderContentLinks()}
          </div>
        </Content>
      </Page>
    );
  }
}

export default Home;
