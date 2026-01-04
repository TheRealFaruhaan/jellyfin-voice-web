import { renderComponent } from 'utils/reactUtils';
import DiscoveryView from '../../apps/experimental/features/discovery/components/DiscoveryView';

/**
 * Movie Discover Tab Controller
 * Renders the React-based DiscoveryView component for browsing
 * movies to discover and download from TMDB.
 */
export default function (view, params, tabContent) {
    let unmountComponent = null;

    this.initTab = function () {
        // Container for the React component
        const container = tabContent.querySelector('.discoveryContainer');
        if (container) {
            container.innerHTML = '';
        }
    };

    this.preRender = function () {
        // Called before rendering
    };

    this.renderTab = function () {
        const container = tabContent.querySelector('.discoveryContainer');
        if (!container) {
            console.warn('Discovery container not found');
            return;
        }

        // Unmount any previous component
        if (unmountComponent) {
            unmountComponent();
            unmountComponent = null;
        }

        // Render the React DiscoveryView component
        unmountComponent = renderComponent(
            DiscoveryView,
            { category: 'movies' },
            container
        );
    };

    this.destroy = function () {
        if (unmountComponent) {
            unmountComponent();
            unmountComponent = null;
        }
    };
}
