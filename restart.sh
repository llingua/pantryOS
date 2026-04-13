#!/bin/bash

set -euo pipefail

"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/stop.sh"
sleep 1
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/start.sh"
