#!/usr/bin/python2

import platform
import sys
import os


if platform.system() != 'Linux':
    sys.stderr.write('mbed-installer: unsupported system "%s"\n' % platform.system())
    sys.exit(1)

try:

    if platform.linux_distribution()[0].lower() == 'debian':
        # debian has a special version
        import virtualenv_debian as virtualenv
        print("Using provided Debian virtualenv")
    else:
        # and this is the original version
        import virtualenv_default as virtualenv
        print("Using provided default virtualenv")

except Exception as e:
    sys.stderr.write('mbed-installer: No suitable virtualenv. Try "sudo pip2 install virtualenv."\n')
    sys.stderr.flush()
    sys.exit(1)

import textwrap
import os
import subprocess

script = """
import urllib

gcc_arm_url = 'https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu-rm/6-2017q2/gcc-arm-none-eabi-6-2017-q2-update-linux.tar.bz2'

def xprint(message, error=False):
    if error:
        sys.stderr.write('mbed-installer: ' + message + '\\n')
        sys.stderr.flush()
    else:
        sys.stdout.write('mbed-installer: ' + message + '\\n')
        sys.stdout.flush()

def exit_on_fail(check_code, exit_code, message):

    if check_code != 0:

        import sys

        xprint(message, True)
        sys.exit(exit_code)

def pip_install(home_dir, package):

    xprint('Installing %s' % package)

    try:
        r = subprocess.call([join(home_dir, 'bin', 'pip'), '-q', 'install', package])
    except:
        r = 1
    finally:
        exit_on_fail(r, 1, 'Failed to install %s' % package)

def download_file(home_dir, url, package, target):

    xprint('Downloading %s' % package)

    try:
        urllib.urlretrieve(url, join(home_dir, target))

        if os.path.isfile(join(home_dir, target)):
            r = 0
        else:
            r = 1

    except Exception as e:
        r = 1
    finally:
        exit_on_fail(r, 1, "Failed to download %s" % package)

def install_tbz2(home_dir, flags, file, package, strip=0):

    xprint('Installing %s' % package)

    try:
        r = subprocess.call(['tar', flags, join(home_dir, file), '--strip-components=%d' % strip, '-C', home_dir])
        os.unlink(join(home_dir, file))
    except:
        r = 1
    finally:
        exit_on_fail(r, 1, "Failed to install %s" % package)

def after_install(options, home_dir):

    gcc_arm_url

    pip_install(home_dir, 'pyserial')
    pip_install(home_dir, 'pyocd')
    pip_install(home_dir, 'mercurial')
    pip_install(home_dir, 'mbed-cli')

    download_file(home_dir, gcc_arm_url, 'gcc-arm-none-eabi', 'gcc-arm-none-eabi.tar.bz2')
    install_tbz2(home_dir, '-jxf', 'gcc-arm-none-eabi.tar.bz2', 'gcc-arm-none-eabi', 1)

"""

try:

    print('Boostrapping installer')

    output = virtualenv.create_bootstrap_script(textwrap.dedent(script))

    script = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mbed-installer.py')

    f = open(script, 'w')
    f.write(output)
    f.close()

    print('Starting installer')

    os.execve(sys.executable, [sys.executable] + [script] + sys.argv[1:], os.environ)

except Exception as e:

    sys.stderr.write('mbed-installer: Unable to bootstrap virtualenv\n')
    sys.stderr.flush()
    sys.exit(1)
