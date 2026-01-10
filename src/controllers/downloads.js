import LibraryMenu from '../scripts/libraryMenu';
import globalize from '../lib/globalize';
import loading from '../components/loading/loading';

let refreshInterval;

export default function (view) {
    const apiClient = window.ApiClient;
    const container = view.querySelector('#downloadsContainer');

    function pauseDownload(downloadId) {
        loading.show();
        apiClient.fetch({
            type: 'POST',
            url: apiClient.getUrl('/MediaAcquisition/Downloads/' + downloadId + '/Pause')
        }).then(() => {
            loadDownloads(false);
        }).catch(err => {
            loading.hide();
            console.error('Failed to pause download:', err);
            alert('Failed to pause download');
        });
    }

    function resumeDownload(downloadId) {
        loading.show();
        apiClient.fetch({
            type: 'POST',
            url: apiClient.getUrl('/MediaAcquisition/Downloads/' + downloadId + '/Resume')
        }).then(() => {
            loadDownloads(false);
        }).catch(err => {
            loading.hide();
            console.error('Failed to resume download:', err);
            alert('Failed to resume download');
        });
    }

    function deleteDownload(downloadId, deleteFiles) {
        if (confirm('Are you sure you want to delete this download?' + (deleteFiles ? ' This will also delete the downloaded files.' : ''))) {
            loading.show();
            apiClient.fetch({
                type: 'DELETE',
                url: apiClient.getUrl('/MediaAcquisition/Downloads/' + downloadId + (deleteFiles ? '?deleteFiles=true' : ''))
            }).then(() => {
                loadDownloads(false);
            }).catch(err => {
                loading.hide();
                console.error('Failed to delete download:', err);
                alert('Failed to delete download');
            });
        }
    }

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
                const title = download.MovieName || download.SeriesName || download.Name || 'Unknown';
                const speed = download.DownloadSpeed ? formatBytes(download.DownloadSpeed) + '/s' : '';
                const eta = download.Eta ? formatTime(download.Eta) : '';
                const isCompleted = statusText === 'Completed' || statusText === 'Seeding';
                const isPaused = statusText === 'Paused';

                html += '<div class="listItem listItem-border" style="padding: 1em;">';
                html += '<div class="listItemBody two-line">';
                html += '<h3 class="listItemBodyText">' + title + '</h3>';
                html += '<div class="listItemBodyText secondary">' + statusText + (speed ? ' - ' + speed : '') + (eta ? ' - ETA: ' + eta : '') + '</div>';
                html += '<div class="itemProgressBar" style="margin-top: 0.5em;"><div class="itemProgressBarForeground" style="width: ' + progressPercent + '%;"></div></div>';
                html += '</div>';

                // Add action buttons
                html += '<div class="listItemButton" style="margin-left: 1em; display: flex; gap: 0.5em;">';

                if (!isCompleted) {
                    if (isPaused) {
                        html += '<button is="paper-icon-button-light" class="btnResumeDownload" data-id="' + download.Id + '" title="Resume"><span class="material-icons">play_arrow</span></button>';
                    } else {
                        html += '<button is="paper-icon-button-light" class="btnPauseDownload" data-id="' + download.Id + '" title="Pause"><span class="material-icons">pause</span></button>';
                    }
                }

                html += '<button is="paper-icon-button-light" class="btnDeleteDownload" data-id="' + download.Id + '" data-completed="' + isCompleted + '" title="Delete"><span class="material-icons">delete</span></button>';
                html += '</div>';

                html += '</div>';
            });

            html += '</div>';
            container.innerHTML = html;

            // Attach event listeners
            container.querySelectorAll('.btnPauseDownload').forEach(btn => {
                btn.addEventListener('click', function() {
                    pauseDownload(this.getAttribute('data-id'));
                });
            });

            container.querySelectorAll('.btnResumeDownload').forEach(btn => {
                btn.addEventListener('click', function() {
                    resumeDownload(this.getAttribute('data-id'));
                });
            });

            container.querySelectorAll('.btnDeleteDownload').forEach(btn => {
                btn.addEventListener('click', function() {
                    const downloadId = this.getAttribute('data-id');
                    const isCompleted = this.getAttribute('data-completed') === 'true';
                    deleteDownload(downloadId, isCompleted);
                });
            });
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

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return hours + 'h ' + minutes + 'm';
    }
    return minutes + 'm';
}
