import LibraryMenu from '../scripts/libraryMenu';
import globalize from '../lib/globalize';
import loading from '../components/loading/loading';

let refreshInterval;

export default function (view) {
    const apiClient = window.ApiClient;
    const container = view.querySelector('#downloadsContainer');

    function loadDownloads(showLoading = true) {
        if (showLoading) {
            loading.show();
        }

        // Fetch active downloads
        apiClient.getJSON(apiClient.getUrl('/MediaAcquisition/Downloads/Active')).then(downloads => {
            loading.hide();

            if (downloads.length === 0) {
                container.innerHTML = '<p class="padded-left">No active downloads</p>';
                return;
            }

            let html = '<div class="itemsContainer vertical-list">';

            downloads.forEach(download => {
                const progressPercent = download.Progress || 0;
                const statusText = download.State || 'Unknown';
                const title = download.Title || 'Unknown';
                const speed = download.DownloadSpeed ? formatBytes(download.DownloadSpeed) + '/s' : '';
                const eta = download.ETA || '';

                html += '<div class="listItem listItem-border" style="padding: 1em;">';
                html += '<div class="listItemBody two-line">';
                html += '<h3 class="listItemBodyText">' + title + '</h3>';
                html += '<div class="listItemBodyText secondary">' + statusText + (speed ? ' - ' + speed : '') + (eta ? ' - ETA: ' + eta : '') + '</div>';
                html += '<div class="itemProgressBar" style="margin-top: 0.5em;"><div class="itemProgressBarForeground" style="width: ' + progressPercent + '%;"></div></div>';
                html += '</div>';
                html += '</div>';
            });

            html += '</div>';
            container.innerHTML = html;
        }).catch(err => {
            loading.hide();
            container.innerHTML = '<p class="padded-left">Unable to load downloads</p>';
            console.error('Failed to fetch downloads:', err);
        });
    }

    view.addEventListener('viewshow', function () {
        LibraryMenu.setTitle('Downloads');
        loadDownloads(true);

        // Auto-refresh every 2 seconds
        refreshInterval = setInterval(() => {
            loadDownloads(false);
        }, 2000);
    });

    view.addEventListener('viewhide', function () {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    });
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
