import virtualenv
import textwrap
import os
import sys
import subprocess

output = virtualenv.create_bootstrap_script(textwrap.dedent("""
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

"""))

print('Boostrapping installer')

f = open('mbed-installer.py', 'w').write(output)

'''
if os.path.isdir(sys.argv[1]):
    subprocess.call(['rm', '-fr', sys.argv[1]])
    print('Deleted previous installation directory')
'''

print('Starting installer')

os.execve(sys.executable, [sys.executable] + ['mbed-installer.py'] + sys.argv[1:], os.environ)
