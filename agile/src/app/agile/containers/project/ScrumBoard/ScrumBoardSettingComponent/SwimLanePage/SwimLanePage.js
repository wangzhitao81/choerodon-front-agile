import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Content, stores } from 'choerodon-front-boot';
import {
 Button, Select, Icon, message 
} from 'choerodon-ui';
import _ from 'lodash';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';

const { AppState } = stores;
const Option = Select.Option;

@observer
class SwimLanePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectValue: '',
    };
  }

  handleSave(select) {
    const data = {
      // objectVersionNumber: select.objectVersionNumber,
      boardId: select.boardId,
      swimlaneBasedCode: this.state.selectValue ? this.state.selectValue : ScrumBoardStore.getSwimLaneCode,
      // projectId: AppState.currentMenuType.id,
    };
    ScrumBoardStore.axiosUpdateBoardDefault(data).then((res) => {
      Choerodon.prompt('保存成功');
    }).catch((error) => {
      Choerodon.prompt('保存失败');
    });
  }

  render() {
    const data = ScrumBoardStore.getBoardList;
    const selectBoard = ScrumBoardStore.getSelectedBoard;
    let defaultSelect;
    for (let index = 0, len = data.length; index < len; index += 1) {
      if (String(data[index].boardId) === String(selectBoard)) {
        defaultSelect = data[index];
      }
    }
    return (
      <Content
        description="泳道是指看板中一横排的主板，基于横排对问题进行状态的流转。泳道类型可以在下面进行修改，并将自动保存。注意：修改泳道会修改看板的分组维度，同时修改看板样式。"
        style={{
          padding: 0,
          height: '100%',
        }}
        link="http://v0-10.choerodon.io/zh/docs/user-guide/agile/sprint/manage-kanban/"
      >
        <Select
          style={{ width: 512 }} 
          label="基础泳道在" 
          defaultValue={ScrumBoardStore.getSwimLaneCode || 'parent_child'}
          onChange={(value) => {
            this.setState({
              selectValue: value,
            }, () => {
              this.handleSave(defaultSelect);
            });
          }}
        >
          <Option value="parent_child">故事</Option>
          <Option value="assignee">经办人</Option>
          <Option value="swimlane_epic">史诗</Option>
          <Option value="swimlane_none">无</Option>
        </Select>
        {/* <div style={{ marginTop: 12 }}>
          <Button
            type="primary" 
            funcType="raised"
            onClick={this.handleSave.bind(this, defaultSelect)}
          >保存</Button>
          <Button style={{ marginLeft: 12 }} funcType="raised">取消</Button>
        </div> */}
      </Content>
    );
  }
}

export default SwimLanePage;
