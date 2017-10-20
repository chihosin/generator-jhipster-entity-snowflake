package <%=packageName%>.jpa.id;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.lang.management.ManagementFactory;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;

/**
 * Snowflake ID 生成器.
 */
public class SnowflakeIdGenerator implements IdentifierGenerator {

    private final static Logger logger = LoggerFactory.getLogger(SnowflakeIdGenerator.class);

    private final long epoch = 1483200000000L;
    private static final long instanceId =
        (String.format("%d%d", getHardwareAddress(), getJvmPid()).hashCode()) & 0xffff;
    private long sequence = 0L;
    private final long sequenceBits = 9L;
    private final long sequenceMax = -1L ^ -1L << this.sequenceBits;
    private final long InstanceIdBits = 16L;
    private final long instanceIdLeftShift = this.sequenceBits;
    private final long timestampLeftShift = this.sequenceBits + this.InstanceIdBits;
    private long lastTimestamp = -1L;

    /**
     * Fetch MAC address.
     *
     * @return MAC Integer MAC address
     */
    private static long getHardwareAddress() {
        byte[] hardwareAddress = null;

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface inteface = interfaces.nextElement();
                if (inteface.isLoopback() || !inteface.isUp())
                    continue;
                hardwareAddress = inteface.getHardwareAddress();
                if (hardwareAddress != null)
                    break;
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }


        StringBuilder builder = new StringBuilder();
        assert hardwareAddress != null;
        for (byte item : hardwareAddress) {
            builder.append(String.format("%02X", item));
        }
        return Long.parseLong(builder.toString(), 16);
    }

    /**
     * Fetch PID.
     *
     * @return pid JVM process ID
     */
    private static long getJvmPid() {
        return Long.parseLong(ManagementFactory.getRuntimeMXBean().getName().split("@")[0]);
    }

    /**
     * Wait for next millis, make sure the return value more than lastTimestamp.
     *
     * @param lastTimestamp The last time stamp
     */
    private long waitingNextMillis(long lastTimestamp) {
        long timestamp = this.getCurrentTime();
        while (timestamp <= lastTimestamp) {
            timestamp = this.getCurrentTime();
        }
        return timestamp;
    }

    /**
     * Get system time.
     */
    private long getCurrentTime() {
        return System.currentTimeMillis();
    }

    /**
     * Generate a new snowflake identifier.
     *
     * @return id Unique ID
     * @throws Exception Generate error
     */
    @SuppressWarnings("WeakerAccess")
    public synchronized long generate() throws Exception {
        long timestamp = this.getCurrentTime();
        if (this.lastTimestamp == timestamp) {
            this.sequence = this.sequence + 1 & this.sequenceMax;
            if (this.sequence == 0) {
                timestamp = this.waitingNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0;
        }

        if (timestamp < this.lastTimestamp) {
            throw new Exception(String.format("clock moved backwards. Refusing to generate id for %d milliseconds", (this.lastTimestamp - timestamp)));
        }

        this.lastTimestamp = timestamp;
        return timestamp - this.epoch << this.timestampLeftShift | SnowflakeIdGenerator.instanceId << this.instanceIdLeftShift | this.sequence;
    }

    /**
     * Generate a new identifier.
     *
     * @param session The session from which the request originates
     * @param object  The entity or collection (idbag) for which the id is being generated
     * @return A new identifier
     * @throws HibernateException Indicates trouble generating the identifier
     */
    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        try {
            return this.generate();
        } catch (Exception e) {
            throw new HibernateException(e);
        }
    }

}
