/**
 * Copyright 2016, Sourcepole AG.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const pickBy = require('lodash.pickby');
const Message = require('../../MapStore2Components/components/I18N/Message');
const CoordinatesUtils = require('../../MapStore2Components/utils/CoordinatesUtils');
const LocaleUtils = require('../../MapStore2Components/utils/LocaleUtils');
const {changeMousePositionState} = require('../actions/mousePosition');
const {changeZoomLevel} = require('../actions/map');
const {CoordinateDisplayer} = require('../components/CoordinateDisplayer');
const displayCrsSelector = require('../selectors/displaycrs');
require('./style/BottomBar.css');

class BottomBar extends React.Component {
    static propTypes = {
        viewertitleUrl: PropTypes.string,
        termsUrl: PropTypes.string,
        displaycrs:  PropTypes.string,
        mapcrs: PropTypes.string,
        mapscale: PropTypes.number,
        mapscales: PropTypes.array,
        activeThemeId: PropTypes.string,
        fullscreen: PropTypes.bool,
        additionalMouseCrs: PropTypes.array,
        changeMousePositionState: PropTypes.func,
        changeZoomLevel: PropTypes.func
    }
    static defaultProps = {
        mapscale: 0
    }
    componentDidMount() {
        this.props.changeMousePositionState({crs: this.props.mapcrs, enabled: true});
    }
    componentWillReceiveProps(newProps) {
        if(newProps.mapcrs !== this.props.mapcrs) {
            newProps.changeMousePositionState({crs: newProps.mapcrs, position: null});
        }
    }
    render() {
        if(this.props.fullscreen) {
            return null;
        }

        let viewertitleLink;
        if (this.props.viewertitleUrl) {
            viewertitleLink = (
                <a href={this.props.viewertitleUrl} target="_blank">
                    <Message className="viewertitle_label" msgId="bottombar.viewertitle_label" />
                </a>
            )
        }
        let termsLink;
        if (this.props.termsUrl) {
            termsLink = (
                <a href={this.props.termsUrl} target="_blank">
                    <Message className="terms_label" msgId="bottombar.terms_label" />
                </a>
            );
        }
        let bottomLinks;
        if (viewertitleLink || termsLink) {
            bottomLinks = (
                <span className="bottomlinks">
                    {viewertitleLink}
                    {viewertitleLink && termsLink ? " | " : null}
                    {termsLink}
                </span>
            );
        }
        let additionalMouseCrs = this.props.additionalMouseCrs || [];
        let availableCRS = pickBy(CoordinatesUtils.getAvailableCRS(), (key, code) => {
            return code === "EPSG:4326" ||
                   code === this.props.mapcrs ||
                   additionalMouseCrs.indexOf(code) !== -1;
           }
        );

        return (
            <div id="BottomBar">
                <span className="mousepos_label"><Message msgId="bottombar.mousepos_label" />: </span>
                <CoordinateDisplayer displaycrs={this.props.displaycrs} />
                <select className="bottombar-crs-selector" onChange={ev => this.props.changeMousePositionState({crs: ev.target.value})} value={this.props.displaycrs}>
                    {Object.keys(availableCRS).map(crs =>
                        (<option value={crs} key={crs}>{availableCRS[crs].label}</option>)
                )}
                </select>
                <span className="scale_label"><Message msgId="bottombar.scale_label" />: </span>
                <select className="bottombar-scale-selector" onChange={ev => this.props.changeZoomLevel(parseInt(ev.target.value, 10))} value={this.props.mapscale}>
                    {this.props.mapscales.map((item, index) =>
                        (<option value={index} key={index}>{"1 : " + LocaleUtils.toLocaleFixed(item, 0)}</option>)
                    )}
                </select>
                {bottomLinks}
            </div>
        );
    }
};

const selector = createSelector([state => state, displayCrsSelector], (state, displaycrs) => {
    let map = state && state.map && state.map ? state.map : null;
    return {
        displaycrs: displaycrs,
        mapcrs: map.projection || "EPSG:3857",
        mapscale: map.zoom || 0,
        mapscales: map.scales || [],
        activeThemeId: state.theme && state.theme.current ? state.theme.current.id : undefined,
        fullscreen: state.display && state.display.fullscreen,
        additionalMouseCrs: state.theme && state.theme.current ? state.theme.current.additionalMouseCrs : []
    };
});

module.exports = {
    BottomBarPlugin: connect(selector, {
        changeMousePositionState: changeMousePositionState,
        changeZoomLevel: changeZoomLevel
    })(BottomBar),
    reducers: {
        mousePosition: require('../reducers/mousePosition')
    }
};
