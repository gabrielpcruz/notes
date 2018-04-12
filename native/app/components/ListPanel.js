import fxaUtils from '../vendor/fxa-utils';
import kintoClient from '../vendor/kinto-client';
import ListItem from './ListItem';
import PropTypes from 'prop-types';
import React from 'react';
import store from "../store";
import sync from "../sync";
import { connect } from 'react-redux';
import { FAB } from 'react-native-paper';
import { View, ListView, Text, StyleSheet, RefreshControl } from 'react-native';
import { COLOR_NOTES_BLUE, COLOR_NOTES_WHITE } from '../utils/constants';
import { kintoLoad } from "../actions";

class ListPanel extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      refreshing: false
    }
  }

  _onRefresh() {
    this.setState({refreshing: true});

    return fxaUtils.fxaGetCredential().then((loginDetails) => {
      return sync.loadFromKinto(kintoClient, loginDetails);
    }).then(() => {
      this.setState({refreshing: false});
    });

  }

  componentWillMount() {
    // TODO: Refactor this for offline view
    sync.retrieveNote(kintoClient).then(result => {
      store.dispatch(kintoLoad(result && result.data));
    }).catch((e) => {
      store.dispatch(kintoLoad());
    });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        { this.renderList() }

        <FAB
          small
          color={COLOR_NOTES_WHITE}
          style={styles.fab}
          icon="add"
          onPress={() => this.newNote()}
        />
      </View>
    );
  }

  newNote() {
    return this.props.navigation.navigate('EditorPanel', {rowId: null});
  }

  renderList() {
    const { navigate } = this.props.navigation;

    if (! this.props.state.notes || this.props.state.notes.length <= 0) {
      return (
        <View>
          <Text>No Notes</Text>
        </View>
      )
    } else {
      const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
      const dataSource = ds.cloneWithRows(
          this.props.state.notes.sort((a, b) => { return a.lastModified <= b.lastModified ? 1 : -1 })
        ) || [];
      return (
          <View>
            <ListView
              dataSource={dataSource}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.refreshing}
                  colors={[COLOR_NOTES_BLUE]}
                  onRefresh={this._onRefresh.bind(this)}
                />
              }
              renderHeader={() => {
                return (
                  <View style={{ backgroundColor: 'white', height: 10}}></View>
                )
              }}
              renderRow={(note, sectionId, rowId) => {
                return (
                  <ListItem
                    id={note.id}
                    content={note.content}
                    lastModified={note.lastModified}
                    rowId={rowId}
                    navigate={navigate}
                  />
                )
              }}
              renderFooter={() => {
                return (
                  // Try to add a shadow but couldn'not working yett make it work :(
                  <View style={{
                    backgroundColor: 'white',
                    height: 10,
                    marginBottom: 100, // To see content after FAB button
                    overflow: 'visible',
                    shadowOpacity: 0.3,
                    shadowColor: '#000',
                    shadowOffset: { width: 10, height: 10},
                    shadowRadius: 2}}>
                  </View>
                )
              }}
            />
          </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLOR_NOTES_BLUE,
    position: 'absolute',
    bottom: 20,
    right: 10,
  },
});

function mapStateToProps(state) {
  return {
    state
  };
}

ListPanel.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(ListPanel)